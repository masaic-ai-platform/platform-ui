# API Integration Guide: `/v1/responses`

This document provides front-end developers with the necessary information to integrate with the `/v1/responses` endpoint for the chat functionality.

## Endpoint

- **URL:** `/v1/responses`
- **Method:** `POST`
- **Host:** `http://localhost:6644`

## Headers

- **Content-Type:** `application/json`
- **Authorization:** `Bearer <YOUR_API_KEY>`
  - The API key should be dynamically retrieved based on the selected model's provider.

## Request Body

The request body is a JSON object with the following structure:

| Field                  | Type                               | Description                                                                                                                                                             | Required |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `model`                | `string`                           | The model identifier, formatted as `provider@model_name` (e.g., `openai@gpt-4.1-mini`).                                                                                   | Yes      |
| `instructions`         | `string`                           | The system prompt or instructions for the model.                                                                                                                        | Yes      |
| `input`                | `array`                            | An array containing the user's message. For conversation history, this should only contain the most recent user message.                                                  | Yes      |
| `text`                 | `object`                           | An object containing text generation parameters.                                                                                                                        | Yes      |
| `temperature`          | `number`                           | Controls randomness. A value between 0.0 and 2.0.                                                                                                                       | Yes      |
| `max_output_tokens`    | `number`                           | The maximum number of tokens to generate.                                                                                                                               | Yes      |
| `top_p`                | `number`                           | Controls diversity via nucleus sampling. A value between 0.0 and 1.0.                                                                                                   | Yes      |
| `store`                | `boolean`                          | If `true`, the response is stored for future reference.                                                                                                                 | Yes      |
| `stream`               | `boolean`                          | If `true`, the response will be streamed using Server-Sent Events (SSE). If `false` or omitted, returns a complete response.                                            | No       |
| `previous_response_id` | `string`                           | The `id` from the previous API response. This is used to maintain conversational context. Omit this field for the first message in a conversation.                       | No       |

### `input` Object Structure

Each object in the `input` array has the following structure:

| Field     | Type    | Description                                       |
| --------- | ------- | ------------------------------------------------- |
| `role`    | `string`| The role of the message sender, currently only `user`. |
| `content` | `array` | An array containing the content of the message.   |

The `content` array contains objects with `type` and `text` fields:
- `type`: "input_text"
- `text`: The user's prompt.

### `text.format` Object Structure

The `text.format` object specifies the desired output format.

| `type`         | Description                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`         | The default, for a plain text response.                                                                                                                                 |
| `json_object`  | To receive a response formatted as a JSON object.                                                                                                                       |
| `json_schema`  | To receive a response that conforms to a specific JSON schema. Requires `name` and `schema` fields.                                                                       |

### Example Request Body (Non-Streaming)

```json
{
    "model": "openai@gpt-4.1-mini",
    "instructions": "You are a helpful assistant.",
    "input": [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "Write a short poem about coding."
                }
            ]
        }
    ],
    "text": {
        "format": {
            "type": "text"
        }
    },
    "temperature": 1,
    "max_output_tokens": 2048,
    "top_p": 1,
    "store": true,
    "previous_response_id": "o27dGvM-zqrih-95b754a028c7918d"
}
```

### Example Request Body (Streaming)

```json
{
    "model": "openai@gpt-4.1-mini",
    "instructions": "You are a helpful assistant.",
    "input": [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "Write a short poem about coding."
                }
            ]
        }
    ],
    "text": {
        "format": {
            "type": "text"
        }
    },
    "temperature": 1,
    "max_output_tokens": 2048,
    "top_p": 1,
    "store": true,
    "stream": true,
    "previous_response_id": "o27dGvM-zqrih-95b754a028c7918d"
}
```

## Response Handling

### Non-Streaming Response

A successful non-streaming response will be a JSON object. The two most important fields for the front-end are:

- **`id`**: A unique identifier for the response. This **must** be captured and sent as `previous_response_id` in the next request to maintain the conversation.
- **`output[0].content[0].text`**: The assistant's message content.

#### Example Success Response

```json
{
    "id": "o27dGvM-zqrih-95b754a028c7918d",
    "object": "response",
    "output": [
        {
            "content": [
                {
                    "text": "In lines of logic, dreams take flight,\nA world of syntax, dark and bright.\nWith every keystroke, futures bloom,\nEscaping confines of a room.",
                    "type": "output_text"
                }
            ],
            "role": "assistant"
        }
    ]
    // ... other fields
}
```

### Streaming Response (Server-Sent Events)

When `stream: true` is set, the response will be delivered as Server-Sent Events (SSE). The client should handle the following event types:

#### Event Types

1. **`response.created`** - Fired when the response is created
   - Contains the response `id` that should be captured for conversation continuity
   
2. **`response.output_text.delta`** - Fired for each text chunk during streaming
   - Contains partial text content that should be appended to the current message
   
3. **`response.output_text.done`** - Fired when text generation is complete
   - Indicates the end of the current text stream
   
4. **`response.completed`** - Fired when the entire response is complete
   - Final event in the stream

#### Example Streaming Events

```
event: response.created
data: {"id": "o27dGvM-zqrih-95b754a028c7918d", "object": "response"}

event: response.output_text.delta
data: {"output": [{"content": [{"text": "In lines", "type": "output_text"}], "role": "assistant"}]}

event: response.output_text.delta
data: {"output": [{"content": [{"text": " of logic,", "type": "output_text"}], "role": "assistant"}]}

event: response.output_text.delta
data: {"output": [{"content": [{"text": " dreams take flight,", "type": "output_text"}], "role": "assistant"}]}

event: response.output_text.done
data: {"output": [{"content": [{"text": "", "type": "output_text"}], "role": "assistant"}]}

event: response.completed
data: {"id": "o27dGvM-zqrih-95b754a028c7918d", "object": "response"}
```

#### Streaming Implementation Notes

1. **Response ID Capture**: The response `id` is available in both `response.created` and `response.completed` events
2. **Text Accumulation**: Each `response.output_text.delta` event contains a text chunk that should be appended to build the complete message
3. **Format Detection**: The `text.format.type` from the request determines how content should be rendered:
   - `text`: Render as markdown with `react-markdown`
   - `json_object`: Apply JSON syntax highlighting during streaming
4. **Error Handling**: If an error occurs during streaming, an error event will be sent

### Error Response

If an error occurs, the response body will contain an `error` object with a `message` field.

#### Example Error Response

```json
{
    "error": {
        "message": "The requested model is not available.",
        "type": "invalid_request_error"
    }
}
```

## Front-End Implementation Details

### Content Rendering

The application uses enhanced content rendering with the following features:

1. **Markdown Support**: Uses `react-markdown` with `remark-gfm` for GitHub Flavored Markdown
2. **JSON Syntax Highlighting**: Custom highlighting function that colors JSON keys, values, and structure
3. **Streaming-Aware Rendering**: Consistent formatting during streaming and completion
4. **Format Detection**: Automatically detects content type (markdown vs JSON) and applies appropriate rendering

### Chat Bubble Features

- **Hover Effects**: Scaling and border highlighting on hover
- **Copy Functionality**: Copy button appears on hover with visual feedback
- **Consistent Styling**: Uses theme colors (`positive-trend` for accents)
- **Responsive Design**: Adapts to different screen sizes

### State Management

The application maintains the following state for conversation continuity:

1. **`previousResponseId`**: Captured from each API response to chain conversations
2. **`messages`**: Array of chat messages with user and assistant roles
3. **`isLoading`**: Boolean to show loading states during API calls
4. **`streamingContent`**: Accumulated content during streaming responses

### API Integration Flow

1. **Request Preparation**: Build request body with current settings and previous response ID
2. **Streaming Setup**: If streaming is enabled, set up EventSource for SSE
3. **Response Processing**: Handle different event types and update UI accordingly
4. **State Updates**: Update conversation state and prepare for next interaction
5. **Error Handling**: Display appropriate error messages and maintain application state

### Configuration Management

The application supports dynamic configuration through:

- **Model Selection**: Different providers and models with appropriate API keys
- **Parameter Tuning**: Temperature, max tokens, top-p via configuration panel
- **Format Selection**: Text, JSON object, or JSON schema output formats
- **Streaming Toggle**: Enable/disable streaming per request 