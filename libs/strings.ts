/* eslint-disable @typescript-eslint/no-unused-vars */
const slugify = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
  return str;
};

export const  stringify = (obj: unknown) => {
  let cache: unknown[] = [];
  let str = JSON.stringify(obj, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = []; // reset the cache
  return str;
}