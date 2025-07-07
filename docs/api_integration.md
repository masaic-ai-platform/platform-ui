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

### Example Request Body

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

## Response Handling

### Successful Response

A successful response will be a JSON object. The two most important fields for the front-end are:

- **`id`**: A unique identifier for the response. This **must** be captured and sent as `previous_response_id` in the next request to maintain the conversation.
- **`output[0].content[0].text`**: The assistant's message content.

### Example Success Response

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

### Error Response

If an error occurs, the response body will contain an `error` object with a `message` field.

### Example Error Response

```json
{
    "error": {
        "message": "The requested model is not available.",
        "type": "invalid_request_error"
    }
}
``` 