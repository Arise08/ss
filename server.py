#!/usr/bin/env python3
"""
Simple local web server for the Interactive Content Editor
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow local file access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("Error: index.html not found!")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Create server
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print("Interactive Content Editor - Local Server")
        print("=" * 60)
        print(f"Server running at: {url}")
        print(f"Serving files from: {os.getcwd()}")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 60)
        
        # Open browser automatically
        try:
            webbrowser.open(url)
            print("\n✓ Browser opened automatically")
        except Exception as e:
            print(f"\n⚠ Could not open browser automatically: {e}")
            print(f"   Please open {url} manually in your browser")
        
        print("\nServer started! Waiting for requests...\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped. Goodbye!")

if __name__ == "__main__":
    main()
