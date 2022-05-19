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

Our current PGP key fingerprint is `C5B7 4989 65EF D1C2 924B  A9D5 39D3 1987 9310 D3FC`

*Note: On 2022-05-11, the existing public key expired. If used, you will see "gpg: Note: This key has expired!" as noted in [Issue 2040](https://github.com/opensearch-project/opensearch-build/issues/2040){:target="_blank"}. Please download the new key which we have extended to 2023-05-12.*

[Get our PGP Key](https://artifacts.opensearch.org/publickeys/opensearch.pgp)