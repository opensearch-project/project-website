---
layout: fullwidth
primary_title: Resources
title: How to verify signatures
---

## How to verify signatures for downloadable artifacts

### <a name="Pgp">PGP</a>
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

### <a name="WindowsSigner">Windows</a>
ODBC driver .msi can be verified by a few different methods.

Verify signature in PowerShell version > 5.1:
```
Get-AuthenticodeSignature -FilePath <path_to_msi>
```

Verify signature using SigCheck:

- Download [SigCheck](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck)

Verify signature using SignTool:

- Download [SignTool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/using-signtool-to-verify-a-file-signature)

Signature Fingerprint:
```
2DA2 DC02 8EE6 42CD 77C4 BA04 F289 1F24 7831 2C29
```

### <a name="CodeSigner">CodeSign</a>
Signature of ODBC driver installer for MacOS could be verified using `pgkutil`.

To verify signature run in the terminal:
```
pkgutil --verbose --check-signature <path_to_pkg>
```

Certificate Fingerprint:
```
49 68 39 4A BA 83 3B F0 CC 5E 98 3B E7 C1 72 AC 85 97 65 18 B9 4C BA 34 62 BF E9 23 76 98 C5 DA
```

## Change Log ##

<div class="table-styler"></div>

| Date       | Issue | Created    | Expires    |
|:-----------|:-------|:-----------|:-----------|
| 2022-05-11 | [Issue 2040](https://github.com/opensearch-project/opensearch-build/issues/2040){:target="_blank"}  | 2022-05-12 | 2023-05-12 |
| 2023-05-04 | [Issue 2136](https://github.com/opensearch-project/opensearch-build/issues/2136){:target="_blank"}  | 2023-05-03 | 2024-05-12 |
| 2023-06-21 | [Issue 97](https://github.com/opensearch-project/sql-jdbc/issues/97){:target="_blank"}  | 2023-04-13 | 2031-11-09 |
| 2023-07-17 | [Issue 3633](https://github.com/opensearch-project/opensearch-build/issues/3633){:target="_blank"}  | 2023-07-05 | 2027-06-28 |
| 2024-05-07 | [Issue 3468](https://github.com/opensearch-project/opensearch-build/issues/3468){:target="_blank"}  | 2024-05-01 | 2025-05-12 |

<br>
