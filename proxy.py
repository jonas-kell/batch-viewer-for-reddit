from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import parse
import requests
import socket
import ssl
from socketserver import ThreadingMixIn

hostName = "0.0.0.0"
serverPort = 9376


class RequestProxyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/check":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(bytes('{"success": true}', "utf-8"))

        elif self.path.startswith("/resource"):
            print(f"Requesting resource, full request: {self.path}")
            query_url = parse.parse_qs(parse.urlparse(self.path).query)["url"][0]
            response = requests.get(query_url)
            content_type = response.headers["Content-type"]
            if response.ok:
                self.send_response(200)
                self.send_header("Content-type", content_type)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(response.content)
            else:
                self.send_response(500)
                print(f"Error: could not query resource")
        else:
            self.send_response(500)
            print(f"Error: not serving on path {self.path}")

class ThreadedHTTPServer (ThreadingMixIn, HTTPServer):
    pass

if __name__ == "__main__":
    hostname = socket.gethostname()
    IPAddr = socket.gethostbyname(hostname)
    print("Proxy Server Name is: " + hostname)
    print("Proxy Server IP Address is: " + IPAddr)

    webServer = ThreadedHTTPServer((hostName, serverPort), RequestProxyServer)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain("./cert.pem", "./key.pem")
    webServer.socket = context.wrap_socket(webServer.socket, server_side=True)
    print("Proxy Server started https://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
