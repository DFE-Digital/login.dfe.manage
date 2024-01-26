const { URL, parse } = require('url');
/**
 * A Utility class to test for valid url's
 * @param {string}      referrerUrl  target url
 * @returns {boolean}   when validate is called it will send true for valid no past history found
 * and false when a match has been found
 */
class UrlValidator {
  constructor(referrerUrl) {
    this.url = referrerUrl;
  }

  /**
     * This takes the target url check length
     * @param {number}  how long the string should be
     * @returns {boolean} if the url is too long it returns false
     */
  isCorrectLength(targetLength) {
    return new Promise((resolve, reject) => {
      if (this.url === undefined || this.url === '' || typeof this.url !== 'string') {
        reject(new TypeError('is not a string or empty'));
      }
      if (this.url.length <= targetLength) {
        const result = true;
        resolve(result);
      } else {
        const result = false;
        resolve(result);
      }
    });
  }

  /**
     * This takes the target url converts to a character
     * @returns {boolean} if the url is not the correct protocal 'http' or https' it returns false
     */
  isValidProtocal() {
    return new Promise((resolve, reject) => {
      if (this.url === undefined || this.url === '' || typeof this.url !== 'string') {
        reject('is not a string or empty');
      } else {
        try {
          const pattern = '^(?!<> mailto|ftp|tcp|<>|[-\\uffff]{2,}|#|%|>|<|\\{|\\}|\\\|\\^|\\~|\\ [| \\ ]|\\|:)(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
          const result = new RegExp(pattern);
          resolve(result.test(this.url));
        } catch (e) {
          reject(e.message);
        }
      }
    });
  }

  /**
     * This takes the target url and checks for illegal charcters
     * @returns {boolean} if the url is found to have illegal characters it returns true
     */
  isValidUrl() {
    return new Promise((resolve, reject) => {
      if (this.url === undefined || this.url === '' || typeof this.url !== 'string') {
        reject('is not a string or empty');
      }
      try {
        const pattern = /[><\]#\[~%\|\{\}\\\^\s`]+/g;
        const result = this.url.match(pattern);
        if (result === null) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (e) {
        reject(new TypeError(e));
      }
    });
  }
}

module.exports = UrlValidator;
