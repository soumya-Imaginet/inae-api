const configs = {
  // # DEVELOPMENT
  APP_URL: "http://localhost:3000",
  BASE_URL: "http://localhost:5000",

  // # LIVE
  // APP_URL: "https://inae.imaginetventures.org",
  // BASE_URL: "https://inaebackend.imaginetventures.org",
};

const returnObject = {
  success: false,
  msg: "",
  data: null,
  pagination: null,
  totalPages: null,
};

const statusCodes = {
  // 2xx: Success
  success: 200, // OK
  created: 201, // Created
  accepted: 202, // Accepted
  no_content: 204, // No Content
  reset_content: 205, // Reset Content
  partial_content: 206, // Partial Content

  // 3xx: Redirection
  moved_permanently: 301, // Moved Permanently
  found: 302, // Found (Previously "Moved Temporarily")
  see_other: 303, // See Other
  not_modified: 304, // Not Modified
  temporary_redirect: 307, // Temporary Redirect
  permanent_redirect: 308, // Permanent Redirect

  // 4xx: Client Errors
  bad_request: 400, // Bad Request
  unauthorized: 401, // Unauthorized
  forbidden: 403, // Forbidden
  not_found: 404, // Not Found
  method_not_allowed: 405, // Method Not Allowed
  not_acceptable: 406, // Not Acceptable
  proxy_auth_required: 407, // Proxy Authentication Required
  request_timeout: 408, // Request Timeout
  conflict: 409, // Conflict
  gone: 410, // Gone
  length_required: 411, // Length Required
  precondition_failed: 412, // Precondition Failed
  payload_too_large: 413, // Payload Too Large
  uri_too_long: 414, // URI Too Long
  unsupported_media_type: 415, // Unsupported Media Type
  range_not_satisfiable: 416, // Range Not Satisfiable
  expectation_failed: 417, // Expectation Failed
  i_am_a_teapot: 418, // I'm a teapot (for fun, part of the HTTP 418 error code)
  misdirected_request: 421, // Misdirected Request
  unprocessable_entity: 422, // Unprocessable Entity
  locked: 423, // Locked
  failed_dependency: 424, // Failed Dependency
  too_early: 425, // Too Early
  upgrade_required: 426, // Upgrade Required
  precondition_required: 428, // Precondition Required
  too_many_requests: 429, // Too Many Requests
  request_header_fields_too_large: 431, // Request Header Fields Too Large
  unavailable_for_legal_reasons: 451, // Unavailable For Legal Reasons

  // 5xx: Server Errors
  internal_server_error: 500, // Internal Server Error
  not_implemented: 501, // Not Implemented
  bad_gateway: 502, // Bad Gateway
  service_unavailable: 503, // Service Unavailable
  gateway_timeout: 504, // Gateway Timeout
  version_not_supported: 505, // HTTP Version Not Supported
  variant_also_negotiates: 506, // Variant Also Negotiates
  insufficient_storage: 507, // Insufficient Storage
  loop_detected: 508, // Loop Detected
  not_extended: 510, // Not Extended
  network_auth_required: 511, // Network Authentication Required
};

module.exports = { configs, returnObject, statusCodes };
