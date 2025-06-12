import os
import requests

class ApiClient:
    """Simple wrapper for making API requests."""
    def __init__(self, base_url=None, api_key=None):
        self.base_url = base_url or os.environ.get("DATA_API_BASE_URL", "")
        self.api_key = api_key or os.environ.get("DATA_API_KEY")

    def call_api(self, path, query=None):
        """Call the remote API and return JSON response."""
        url = self.base_url.rstrip("/") + "/" + path.lstrip("/")
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        resp = requests.get(url, params=query, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
