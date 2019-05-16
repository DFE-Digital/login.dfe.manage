const mapAsync = async (col, iteratee) => {
  if (col.length === undefined) {
    throw new Error('col is not iterable');
  }

  const result = [];
  for (let i = 0; i < col.length; i += 1) {
    result[i] = await iteratee(col[i], i);
  }
  return result;
};

const forEachAsync = async (col, iteratee) => {
  if (col.length === undefined) {
    throw new Error('col is not iterable');
  }

  for (let i = 0; i < col.length; i += 1) {
    await iteratee(col[i], i);
  }
};

module.exports = {
  mapAsync,
  forEachAsync,
};
