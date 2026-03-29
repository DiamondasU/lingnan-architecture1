export const DYNASTY_OPTIONS = [
  "先秦",
  "秦汉",
  "魏晋南北朝",
  "隋唐",
  "宋元",
  "明清",
  "清代",
  "近现代",
  "当代"
];

export const BUILDING_GROUP_OPTIONS = [
  "宫署遗址",
  "祠堂书院",
  "园林宅院",
  "民居聚落",
  "骑楼街区",
  "庙宇坛庙",
  "侨乡碉楼",
  "工艺遗产",
  "海防与港口",
  "保护与更新"
];

export const TYPE_OPTIONS = [
  "journal-article",
  "book-chapter",
  "book",
  "dissertation",
  "dataset",
  "report",
  "conference-paper",
  "posted-content",
  "other"
];

export const LINGNAN_TOPIC_SUGGESTIONS = [
  "岭南园林 借景 水院",
  "西关大屋 满洲窗 趟栊门",
  "开平碉楼 侨乡 建筑",
  "岭南骑楼 街区 商业",
  "陈家祠 灰塑 木雕",
  "佛山祖庙 脊饰 灰塑",
  "蚝壳墙 民居 材料",
  "南越国 宫署 遗址 广州"
];

export const CURATED_READING_SEEDS = [
  { title: "陈家祠", summary: "适合进入岭南宗祠、装饰工艺与族群空间研究。", query: "陈家祠 岭南 建筑" },
  { title: "余荫山房", summary: "适合比较岭南园林与江南园林的空间气质差异。", query: "余荫山房 岭南 园林" },
  { title: "开平碉楼", summary: "适合从侨乡、现代性与中西融合角度切入。", query: "开平碉楼 建筑 侨乡" },
  { title: "西关大屋", summary: "适合研究民居、商业资本、通风构造与地方生活方式。", query: "西关大屋 满洲窗 趟栊门" }
];

const dynastyKeywordMap = {
  "先秦": ["先秦", "先秦时期"],
  "秦汉": ["秦汉", "汉代", "汉朝", "南越国", "han dynasty", "qin dynasty", "nanyue"],
  "魏晋南北朝": ["魏晋", "南北朝", "jin dynasty"],
  "隋唐": ["隋", "唐", "tang dynasty"],
  "宋元": ["宋", "元", "song dynasty", "yuan dynasty"],
  "明清": ["明", "清", "ming dynasty", "qing dynasty", "late imperial"],
  "清代": ["清代", "清末", "late qing", "qing"],
  "近现代": ["民国", "近代", "modern", "republican", "20th century"],
  "当代": ["当代", "保护", "更新", "修复", "conservation", "heritage management", "adaptive reuse"]
};

const buildingKeywordMap = {
  "宫署遗址": ["宫署", "宫殿", "palace", "遗址", "site", "royal"],
  "祠堂书院": ["祠堂", "宗祠", "书院", "ancestral hall", "academy"],
  "园林宅院": ["园林", "宅院", "garden", "residence", "shanfang"],
  "民居聚落": ["民居", "村落", "聚落", "house", "dwelling", "residential"],
  "骑楼街区": ["骑楼", "arcade", "shop house", "streetscape"],
  "庙宇坛庙": ["庙", "庙宇", "寺", "temple", "ritual"],
  "侨乡碉楼": ["碉楼", "diaolou", "overseas chinese", "watchtower"],
  "工艺遗产": ["窑", "古灶", "工艺", "kiln", "craft", "ceramic"],
  "海防与港口": ["海防", "港口", "炮台", "harbor", "fort", "maritime"],
  "保护与更新": ["保护", "更新", "修复", "renewal", "conservation", "heritage"]
};

export function inferDynasty(text) {
  const haystack = (text || "").toLowerCase();
  for (const [dynasty, keywords] of Object.entries(dynastyKeywordMap)) {
    if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) return dynasty;
  }
  return "未标注";
}

export function inferBuildingGroup(text) {
  const haystack = (text || "").toLowerCase();
  for (const [group, keywords] of Object.entries(buildingKeywordMap)) {
    if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) return group;
  }
  return "保护与更新";
}

export function normalizeWorkType(type) {
  if (!type) return "other";
  const lowered = type.toLowerCase();
  return TYPE_OPTIONS.includes(lowered) ? lowered : "other";
}
