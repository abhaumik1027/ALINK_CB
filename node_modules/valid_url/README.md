# Valid_url

Checks if a given string is a url. This package is used by me to look for links in user imputs like many chats or apps.

Some accepted combinatios are:

```
http://domain.any
https://domain.any
http://www.domain.any
https://www.domain.any
ftp://test@example.com
api.example.com
```

Note that emails are also works as links for the purpose of this package

## Installation

`npm install valid_url`

## Usage

```
var checkUrl = require('valid_url');
checkUrl("yabirgb.com")
```

## Changelog

### 1.1.1
Fixed minor errors in regex

### 1.0.4
Initial package

## License

MIT
