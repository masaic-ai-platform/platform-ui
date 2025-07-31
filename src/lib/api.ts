import { API_URL } from '@/config';

class ApiClient {
  private getModelApiKey(): string | null {
    // This would get the model API key from your existing logic
    // For now, return null to maintain existing behavior
    return null;
  }

  private getGoogleToken(): string | null {
    return localStorage.getItem('google_token');
  }

  private async isAuthEnabled(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/v1/dashboard/platform/info`);
      const platformInfo = await response.json();
      return platformInfo.authConfig?.enabled || false;
    } catch {
      return false;
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add model API key (existing behavior)
    const modelApiKey = this.getModelApiKey();
    if (modelApiKey) {
      headers['Authorization'] = `Bearer ${modelApiKey}`;
    }

    // Add Google token if auth is enabled
    const authEnabled = await this.isAuthEnabled();
    if (authEnabled) {
      const googleToken = this.getGoogleToken();
      if (googleToken) {
        headers['X-Google-Token'] = googleToken;
      }
    }

    return headers;
  }

  private handleAuthError() {
    // Clear invalid token
    localStorage.removeItem('google_token');
    // Redirect to login or show error
    window.location.reload();
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = { ...await this.getHeaders(), ...options.headers };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle authentication error
      this.handleAuthError();
    }

    return response;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 