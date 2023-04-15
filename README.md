### Purpose

Backup a bunch of reddit posts into one singular file to be able to view it offline.

Later go through the posts while on the train or on vacation without internet.

Many convenience features could be added, but at th moment this is just for my fun of developing and not even the most capable solution on github.

Supports encryption, as I wanted an experiment to play around with the `crypto` api.

### Supported browsers

Complete featureset currently only working for chrome.
Archiving working on most browsers, but images get only downloaded when starting th app locally (because of cors).
No browser except chrome currently has access to the [File System Access API](https://web.dev/file-system-access/), so the zip files for playback need to be loaded from smaller zip files with the lower-performance file pickers instead.

### Hosted version

Hosted and installable (as a [PWA](https://web.dev/progressive-web-apps/)) under [https://jonas-kell.github.io/batch-viewer-for-reddit/](https://jonas-kell.github.io/batch-viewer-for-reddit/).

### Local testing

Run in the base of the project:

```cmd
python3 -m http.server 8080 --bind 127.0.0.1
```

This is also useful for archiving, because most of the images that are hosted on `i.redd.it` will net get served to the online version because of [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
However when running the server locally and opening [http://localhost:8080](http://localhost:8080), cors is allowed by reddit's CDN.

### Archiving if not on localhost

As stated in the previous section, CORS forbids archiving on the hosted version.
To circumvent this, start a Proxy Server on a local machine, that has port 9376 open (look up how this works, but do not open to the internet, the server is unsecure).

As this will require a secure context, you need to generate a ssl-certificate (in the application folder):

```cmd
openssl req -subj "/C=DE/CN=proxy" -addext "subjectAltName = DNS:proxy.lan" -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
```

However you need to make your browser trust your self signed certificate. And your DNS points `proxy.lan` to the server. This is non-trivial and probably requires a bit of googeling, sry.
(Export to a `.pfx` file with password `mypassword` by running `openssl pkcs12 -export -out bundle.pfx -inkey key.pem -in cert.pem -passout pass:mypassword`).

Start the server with

```cmd
python3 proxy.py
```

It will tell you the computers ip. Enter it into the `Proxy Server` field in the archive tab.
