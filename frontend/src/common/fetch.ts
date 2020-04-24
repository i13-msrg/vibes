import 'whatwg-fetch';


/*
 * Handles HTTP response with status code 4xx or 5xx as errors, like super agent does:
 *
 * http://visionmedia.github.io/superagent/#error-handling
 * -------------------------------------------------------
 * Note that a 4xx or 5xx response with super agent are considered an error by default. For
 * example if you get a 500 or 403 response, this status information will be available via
 * err.status. Errors from such responses also contain an err.response field with all of the
 * properties mentioned in "Action properties". The library behaves in this way to handle
 * the common case of wanting success responses and treating HTTP error status codes as
 * errors while still allowing for custom logic around specific error conditions.
 *
 * Network failures, timeouts, and other errors that produce no response will contain no
 * err.status or err.response fields.
 */
export default function fetchCustom(url: string, options?: any): any {
  document.dispatchEvent(new CustomEvent('fetch:start'));

  return (
    fetch(url, {
      headers : {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },

    })
      .then(response => response.json().then((body) => {
        if (response.status >= 400) {
          // it's payload: body.error instead of error: body.error in order to avoid
          // access like fetch.catch(error => error.error)
          return Promise.reject({ status: response.status, payload: body.error });
        }
        return body;
      }))
      .then((res) => {
        document.dispatchEvent(new CustomEvent('fetch:done'));
        return res;
      })
      .catch((err) => {
        document.dispatchEvent(new CustomEvent('fetch:done'));
        return Promise.reject(err);
      })
  );
}
