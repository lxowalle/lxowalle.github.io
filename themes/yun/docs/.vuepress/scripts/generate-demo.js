/**
 * 在标签间插入内容
 * @param {string} content 原内容
 * @param {string} injectedContent 被插入的内容
 */
function injectContentBetweenTags(content, injectedContent) {
  const namespace = "demo-sites";
  const startTag = `<!-- ${namespace}:start -->`;
  const endTag = `<!-- ${namespace}:end -->`;

  const startIndex = content.indexOf(startTag);
  const endIndex = content.indexOf(endTag, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    return "";
  }
  return [
    content.slice(0, startIndex + startTag.length),
    "\n<!-- prettier-ignore-start -->",
    "\n<!-- markdownlint-disable -->\n",
    injectedContent,
    "\n<!-- markdownlint-restore -->",
    "\n<!-- prettier-ignore-end -->\n",
    content.slice(endIndex),
  ].join("");
}

/**
 * 生成 Demo Site 模版
 * @param {Site} site
 */
function generateDemoSite(site) {
  return `<a href="${site.url}" target="_blank">
        <img width="80px" src="${site.avatar}" />
        <br />
        <sub title="${site.desc}">${site.name}</sub>
      </a>`;
}

/**
 * 生成 Demo Sites 表格
 * @param {Site[]} sites
 */
function generateDemoSitesTable(sites) {
  let tableContent = "";
  const numOfRow = 8;
  const totalRows = Math.ceil(sites.length / numOfRow);
  for (let row = 0; row < totalRows; row++) {
    tableContent += `\n  <tr align="center">\n`;
    for (let col = 0; col < numOfRow; col++) {
      const site = sites[row * numOfRow + col];
      tableContent += `    <td>
      ${generateDemoSite(site)}
    </td>\n`;
    }
    tableContent += `  </tr>`;
  }
  return `<table align="center">${tableContent}\n</table>`;
}

module.exports = {
  injectContentBetweenTags,
  generateDemoSitesTable,
};
