from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import parse
import requests
import socket
import ssl
from socketserver import ThreadingMixIn
import argparse

# pip install "requests[socks]"


class RequestProxyServer(BaseHTTPRequestHandler):
    def __init__(self, request, client_address, server, tor_enabled=False):
        self.tor_enabled = tor_enabled
        super().__init__(request, client_address, server)

    def do_GET(self):
        if self.path == "/check":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(bytes('{"success": true}', "utf-8"))
        elif self.path == "/check_tor":
            check_url = "https://check.torproject.org/"
            tor_check = False

            # ! make sure to create pahts that return true without checking
            if self.tor_enabled:
                response_ok, response_content_type, response_content = (
                    self.proxy_request(check_url)
                )

                if response_ok:
                    try:
                        string_object = response_content.decode()

                        if (
                            "Congratulations. This browser is configured to use Tor."
                            in string_object
                        ):
                            tor_check = True
                    except Exception:
                        tor_check = False

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                bytes(
                    f'{{"tor_connection": {"false" if not tor_check else "true"}}}',
                    "utf-8",
                )
            )

        elif self.path.startswith("/resource"):  # startswith because url arguments
            print(f"Requesting resource, full request: {self.path}")
            has_necessary_parameters = False
            try:
                query_url = parse.parse_qs(parse.urlparse(self.path).query)["url"][0]
                has_necessary_parameters = True
            except KeyError:
                self.send_response(500, "Error: url argument missing")
                self.end_headers()
                print(f"Error: url argument missing")

            if has_necessary_parameters:
                response_ok, response_content_type, response_content = (
                    self.proxy_request(query_url)
                )
                if response_ok:
                    self.send_response(200)
                    self.send_header("Content-type", response_content_type)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(response_content)
                else:
                    self.send_response(500, "Error: could not query resource")
                    self.end_headers()
                    print(f"Error: could not query resource")
        else:
            self.send_response(500, f"Error: not serving on path {self.path}")
            self.end_headers()
            print(f"Error: not serving on path {self.path}")

    def proxy_request(self, url):
        try:
            if self.tor_enabled:
                proxies = {
                    "http": "socks5://localhost:9050",
                    "https": "socks5://localhost:9050",
                }
                response = requests.get(url, proxies=proxies)
            else:
                response = requests.get(url)
        except requests.RequestException as e:
            # Handle request exceptions
            print("Error making request:", e)
            return False, None, None

        return (response.ok, response.headers["Content-type"], response.content)


class ThreadedProxyServer(ThreadingMixIn, HTTPServer):
    pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Proxy script for the batch viewer")
    parser.add_argument(
        "--ssl", action="store_true", help="Enable SSL (Secure Socket Layer)"
    )
    parser.add_argument(
        "--tor", action="store_true", help="Enable Tor (The Onion Router)"
    )
    parser.add_argument(
        "--expose", action="store_true", help="Expose outside of the local machine"
    )
    parser.add_argument(
        "--port", type=int, default=9376, help="Server Port number (default: 9376)"
    )

    args = parser.parse_args()

    parser.print_help()

    use_ssl = args.ssl
    use_tor = args.tor
    serverPort = args.port
    expose = args.expose

    if expose:
        hostName = "0.0.0.0"
    else:
        hostName = "127.0.0.1"

    hostname = socket.gethostname()
    IPAddr = socket.gethostbyname(hostname)
    print("Proxy Server Name is: " + hostname)
    print("Proxy Server IP Address is: " + IPAddr)

    webServer = ThreadedProxyServer(
        (hostName, serverPort),
        lambda *args, **kwargs: RequestProxyServer(
            *args, **kwargs, tor_enabled=use_tor
        ),
    )

    if expose:
        whereToFind = IPAddr
    else:
        whereToFind = hostName

    if use_ssl:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain("./certs/cert.pem", "./certs/key.pem")
        webServer.socket = context.wrap_socket(webServer.socket, server_side=True)
        print("Proxy Server started https://%s:%s" % (whereToFind, serverPort))
    else:
        print("Proxy Server started http://%s:%s" % (whereToFind, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
