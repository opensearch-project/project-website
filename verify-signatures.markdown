---
layout: fullwidth
primary_title: Resources
title: How to verify signatures
---

## How to verify signatures for downloadable artifacts

Download our PGP key using the link below and import it. 

If you’re using gpg, you just need to run: 

```
gpg --import /path/to/key
````

You can then verify the signature by downloading it into the same directory where you downloaded the tarball, and running:

```
gpg --verify /path/to/signature /path/to/tarball
```

It should show a good signature signed by opensearch@amazon.com.

Our current PGP key fingerprint is `C2EE 2AF6 542C 03B4`

[Get our PGP Key](https://artifacts.opensearch.org/publickeys/opensearch.pgp)