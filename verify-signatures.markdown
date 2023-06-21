---
layout: fullwidth
primary_title: Resources
title: How to verify signatures
---

## How to verify signatures for downloadable artifacts

### PGP
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

[Get our PGP Key](https://artifacts.opensearch.org/publickeys/opensearch.pgp)

*Note: If you see "gpg: Note: This key has expired!" as originally noted in [Issue 2040](https://github.com/opensearch-project/opensearch-build/issues/2040){:target="_blank"}, please download the newest key. See change log for dates.*

### <a name="JarSigner">JarSigner</a>
Only the JDBC driver is signed with JarSigner.
To verify signature run in the terminal:
```
jarsigner -verify -verbose <path_to_jar>
```

## Change Log ##

<div class="table-styler"></div>

| Date         | Issue | Created | Expires |
|:-------------|:-------|:----------------|:----------------|
| 2022-05-11  | [Issue 2040](https://github.com/opensearch-project/opensearch-build/issues/2040){:target="_blank"}  | 2022-05-12 | 2023-05-12 |
| 2023-05-04  | [Issue 2136](https://github.com/opensearch-project/opensearch-build/issues/2136){:target="_blank"}  | 2023-05-03 | 2024-05-12 |
| 2023-06-21  | [Issue 3652](https://github.com/opensearch-project/opensearch-build/issues/3652){:target="_blank"}  | 2023-04-13 | 2024-04-16 |

<br>