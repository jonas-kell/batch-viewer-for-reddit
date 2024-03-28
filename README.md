# Batch-Viewer what is it?

Backup a bunch of reddit posts into one singular file to be able to view it offline.

Later go through the posts while on the train or on vacation without internet.

Many convenience features could be added, but at th moment this is just for my fun of developing and not even the most capable solution on github.

Supports encryption, as I wanted an experiment to play around with the `crypto` api.

## Supported browsers

Complete feature set currently only working for chrome.
Archiving working on most browsers, but images get only downloaded when starting th app locally (because of cors).
No browser except chrome currently has access to the [File System Access API](https://web.dev/file-system-access/), so the zip files for playback need to be loaded from smaller zip files with the lower-performance file pickers instead.

## Hosted version

Hosted and installable (as a [PWA](https://web.dev/progressive-web-apps/)) under [https://jonas-kell.github.io/batch-viewer-for-reddit/](https://jonas-kell.github.io/batch-viewer-for-reddit/).

## Local developing and running

Run in the base of the project:

```shell
npm run dev
```

This is also useful for archiving, because most of the images that are hosted on `i.redd.it` will net get served to the online version because of [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
However when running the server locally and opening [http://localhost:5173/batch-viewer-for-reddit/](http://localhost:5173/batch-viewer-for-reddit/), cors is allowed by reddit's CDN.

To test PWA installation locally:

```shell
npm run preview
```

See here: [http://localhost:4173/batch-viewer-for-reddit/](http://localhost:4173/batch-viewer-for-reddit/).

## Archiving if not on localhost

As stated in the previous section, CORS forbids archiving on the hosted version.
To circumvent this, start a Proxy Server on a local machine, that has port 9376 open (look up how this works, but do not open to the internet, the server is unsecure).

### The proxy server

Start the server with

```shell
python3 proxy.py
```

It will tell you the computers ip. Enter it into the `Proxy Server` field in the archive tab.
(Or use local/global DNS if configured).

#### Arguments: Expose

If the proxy is only used locally, it should be used without the `--expose` flag.
Then the proxy will only serve on `127.0.0.1` to avoid exposing anything.

#### Arguments: SSL

Using a proxy if the application is deployed on a https-URL, will require a secure context for the proxy.
You need to generate a ssl-certificate (in the application folder):

```shell
openssl req -subj "/C=DE/CN=proxy" -addext "subjectAltName = DNS:proxy.lan" -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
```

However you need to make your browser trust your self signed certificate. And your DNS points `proxy.lan` to the server. This is non-trivial and probably requires a bit of googeling, sry.
(Export to a `.pfx` file with password `mypassword` by running `openssl pkcs12 -export -out bundle.pfx -inkey key.pem -in cert.pem -passout pass:mypassword`).

Alternatively, you could configure a ssl-terminating reverse proxy with something like `nginx`.
That one could use Let's Encrypt or any other cert.

If used only locally and/or with different ssl-termination, the proxy may run without self signed certificate/SSL.
Only if you want to use the certs from the local folder, add the flag `--ssl`.

#### Arguments: Port

If an extra reverse proxy is used, it is probably necessary to run the server on a different port.
You can use `--port=12323` to achieve this.

Default is `9376` and the application expects this port to be the correct one in the end.

#### Arguments: Tor

When you add the flag `--tor`, the proxy will attempt to pass all the traffic through the tor network.
Therefore you require having a running tor installation on the machine that runs the script.

(Tor port must be `9050`)

```shell
# Check what ports are used
sudo lsof -i -P -n | grep LISTEN

# install tor
sudo apt install tor
sudo apt install python3-pip
pip3 install "requests[socks]"

# run tor
tor
```
