import http.server
import socketserver
import urllib.request
import urllib.parse
import os
import sys

PORT = 8000

class PortalHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/download':
            # Extract query params
            params = urllib.parse.parse_qs(parsed_url.query)
            drive_id = params.get('id', [None])[0]
            new_filename = params.get('name', [None])[0]
            
            if not drive_id or not new_filename:
                self.send_error(400, "Missing 'id' or 'name' query parameter")
                return
                
            # Decode name
            new_filename = urllib.parse.unquote(new_filename)
            
            # Replace invalid filename characters to avoid Windows file errors
            for char in ['/', '\\', ':', '*', '?', '"', '<', '>', '|']:
                new_filename = new_filename.replace(char, '_')
                
            drive_url = f"https://drive.google.com/uc?export=download&id={drive_id}"
            
            try:
                # Add headers to mimic browser request to bypass basic blocks
                req = urllib.request.Request(
                    drive_url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                )
                
                print(f"[DOWNLOAD] Fetching from Google Drive: {drive_id}")
                with urllib.request.urlopen(req) as response:
                    content_type = response.headers.get('Content-Type', 'application/octet-stream')
                    file_bytes = response.read()
                
                print(f"[DOWNLOAD] Serving file: {new_filename} ({len(file_bytes)} bytes)")
                
                # Respond to browser
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                
                # Encode filename for header to support Thai characters in filename
                quoted_filename = urllib.parse.quote(new_filename)
                self.send_header('Content-Disposition', f"attachment; filename*=UTF-8''{quoted_filename}")
                self.send_header('Content-Length', str(len(file_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(file_bytes)
                
            except Exception as e:
                print(f"[ERROR] Failed to fetch or serve file: {e}")
                self.send_error(500, f"Error processing file download: {e}")
        else:
            # Serve standard static files (index.html, style.css, etc.)
            super().do_GET()

def run_server():
    # Set CWD to the directory of the script to serve static files correctly
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Reconfigure output to support UTF-8 on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), PortalHandler) as httpd:
        print("=========================================================")
        print("=== Dechaphop-AIS Structure Solar 2026 Local Server ===")
        print(f"  Server is running at: http://localhost:{PORT}")
        print("  Keep this command prompt window open while using the portal.")
        print("  Press Ctrl+C in this window to stop the server.")
        print("=========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down...")

if __name__ == "__main__":
    run_server()
