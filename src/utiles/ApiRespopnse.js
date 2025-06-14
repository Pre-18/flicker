class ApiResponse {
  constructor(status, message = "Success", data ) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success=status<400; // Assuming status codes < 400 are successful
  }

}
export { ApiResponse }