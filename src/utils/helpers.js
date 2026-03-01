function parsePagination(query) {
  const page = Number.isNaN(Number(query.page)) || !query.page ? 1 : Number(query.page);
  const limit = Number.isNaN(Number(query.limit)) || !query.limit ? 20 : Number(query.limit);

  // Clamp to a reasonable maximum
  const safeLimit = limit > 200 ? 200 : limit;

  return {
    page,
    limit: safeLimit,
  };
}

module.exports = {
  parsePagination,
};
