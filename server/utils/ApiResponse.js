class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.statusCode = statusCode;
  }

  static success(data, message = 'Success', meta = null) {
    return new ApiResponse(200, message, data, meta);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(201, message, data);
  }

  static accepted(message = 'Request accepted') {
    return new ApiResponse(202, message);
  }

  static noContent(message = 'No content') {
    return new ApiResponse(204, message);
  }
}

module.exports = ApiResponse;
