const mapAsync = async (col, iteratee, chunkSize = 50) => {
  if (col.length === undefined) {
    throw new Error("col is not iterable");
  }

  if (chunkSize <= 0) {
    throw new Error("chunk size must be > 0");
  }

  const temp = [...col];
  const chunks = [];
  while (temp.length) {
    chunks.push(temp.splice(0, chunkSize));
  }

  const result = [];

  for (let chunk = 0; chunk < chunks.length; chunk += 1) {
    // Await in loop required to chunk up requests to avoid overloading our APIs.
    // eslint-disable-next-line no-await-in-loop
    const chunkResult = await Promise.all(
      chunks[chunk].map((value, index) =>
        iteratee(value, chunk * chunkSize + index),
      ),
    );
    result.push(...chunkResult);
  }

  return result;
};

const forEachAsync = async (col, iteratee) => {
  if (col.length === undefined) {
    throw new Error("col is not iterable");
  }

  for (let i = 0; i < col.length; i += 1) {
    // We want this to run in order, so await in for is needed.
    // eslint-disable-next-line no-await-in-loop
    await iteratee(col[i], i);
  }
};

module.exports = {
  mapAsync,
  forEachAsync,
};
