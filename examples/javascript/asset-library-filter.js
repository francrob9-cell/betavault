function normalizeTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesQuery(asset, query) {
  const term = normalizeTerm(query);
  if (!term) return true;
  const haystack = [
    asset.title,
    asset.type,
    asset.client,
    asset.campaign,
    ...(asset.tags || []),
  ]
    .map(normalizeTerm)
    .join(" ");
  return haystack.includes(term);
}

function filterAssets(assets, filters = {}) {
  return assets.filter((asset) => {
    if (filters.type && asset.type !== filters.type) return false;
    if (filters.client && asset.client !== filters.client) return false;
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.query && !matchesQuery(asset, filters.query)) return false;
    if (filters.tags?.length && !filters.tags.every((tag) => (asset.tags || []).includes(tag))) return false;
    return true;
  });
}

function groupAssetsByCampaign(assets) {
  return assets.reduce((groups, asset) => {
    const key = asset.campaign || "Unassigned";
    groups[key] = groups[key] || [];
    groups[key].push(asset);
    return groups;
  }, {});
}

function buildClientDelivery(assets, client) {
  const clientAssets = filterAssets(assets, { client, status: "approved" });
  return {
    client,
    totalAssets: clientAssets.length,
    photos: clientAssets.filter((asset) => asset.type === "photo").length,
    videos: clientAssets.filter((asset) => asset.type === "video").length,
    campaigns: groupAssetsByCampaign(clientAssets),
  };
}

module.exports = {
  buildClientDelivery,
  filterAssets,
  groupAssetsByCampaign,
};
