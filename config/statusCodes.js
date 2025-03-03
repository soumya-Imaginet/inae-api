export default statusCodes = {
  // 1xx: Informational Responses
  '100': 100, //Continue
  '101': 101, //Switching Protocols
  '102': 102, //Processing (WebDAV)
  '103': 103, //Early Hints

  // 2xx: Success
  '200': 200, //OK
  '201': 201, //Created
  '202': 202, //Accepted
  '203': 203, //Non-Authoritative Information
  '204': 204, //No Content
  '205': 205, //Reset Content
  '206': 206, //Partial Content
  '207': 207, //Multi-Status (WebDAV)
  '208': 208, //Already Reported (WebDAV)
  '226': 226, //IM Used

  // 3xx: Redirection
  '300': 300, //Multiple Choices
  '301': 301, //Moved Permanently
  '302': 302, //Found
  '303': 303, //See Other
  '304': 304, //Not Modified
  '305': 305, //Use Proxy (Deprecated)
  '306': 306, //(Unused)
  '307': 307, //Temporary Redirect
  '308': 308, //Permanent Redirect

  // 4xx: Client Errors
  '400': 400, //Bad Request
  '401': 401, //Unauthorized
  '402': 402, //Payment Required (Reserved)
  '403': 403, //Forbidden
  '404': 404, //Not Found
  '405': 405, //Method Not Allowed
  '406': 406, //Not Acceptable
  '407': 407, //Proxy Authentication Required
  '408': 408, //Request Timeout
  '409': 409, //Conflict
  '410': 410, //Gone
  '411': 411, //Length Required
  '412': 412, //Precondition Failed
  '413': 413, //Payload Too Large
  '414': 414, //URI Too Long
  '415': 415, //Unsupported Media Type
  '416': 416, //Range Not Satisfiable
  '417': 417, //Expectation Failed
  '418': 418, //I'm a Teapot (Easter Egg)
  '421': 421, //Misdirected Request
  '422': 422, //Unprocessable Entity (WebDAV)
  '423': 423, //Locked (WebDAV)
  '424': 424, //Failed Dependency (WebDAV)
  '425': 425, //Too Early
  '426': 426, //Upgrade Required
  '428': 428, //Precondition Required
  '429': 429, //Too Many Requests
  '431': 431, //Request Header Fields Too Large
  '451': 451, //Unavailable For Legal Reasons

  // 5xx: Server Errors
  '500': 500, //Internal Server Error
  '501': 501, //Not Implemented
  '502': 502, //Bad Gateway
  '503': 503, //Service Unavailable
  '504': 504, //Gateway Timeout
  '505': 505, //HTTP Version Not Supported
  '506': 506, //Variant Also Negotiates
  '507': 507, //Insufficient Storage (WebDAV)
  '508': 508, //Loop Detected (WebDAV)
  '510': 510, //Not Extended
  '511': 511, //Network Authentication Required
};
