// src/data/books.ts

export interface BookRecord {
  id: string;
  title: string;
  navDate: string; // "1368-01-01T00:00:00Z"
  year: number;
  dynasty: string;
  description: string;
  subjects: string[];
  category: "botany" | "mathematics" | "astronomy"; // Unified top-level category for filtering
  manifestUrl: string;
  museumUrl?: string;         // Direct museum/library catalogue URL
  thumbnailUrl: string;
  pageCount: number;

  institution: string;        // e.g., "Bodleian Libraries"
  attribution: string;        // e.g., "Photo: © Bodleian Libraries..."
  license?: string;           // e.g., "CC BY-NC 4.0"
  language: string[];         // Array, e.g., ["Arabic", "Greek"]
  authors: string[];          // e.g., ["Dioscorides Pedanius"]
  shelfmark: string;          // e.g., "Bodleian Library MS. Arab. d. 138"
  
  hasIllustrations: boolean;  // Based on "Decoration" metadata
  illustrationCount?: number; // e.g., 289 (from Bodleian's metadata)

  logoUrl?: string;           // Museum logo

  /** Azure blob storage book folder ID for RHS/libnova books.
   *  When set, the AI Hub viewer loads pages from Azure instead of the IIIF server. */
  blobBookId?: string;
}

const publicManifestUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}manifests/${fileName}`;

export const bookData: BookRecord[] = [
  {
    id: "bpt6k98181886",
    title: "Kang xi yong nian li fa",
    navDate: "1662-01-01T00:00:00Z",
    year: 1662,
    dynasty: "Qing",
    description: "Kang xi yong nian li fa (Eternal Calendar of the Kangxi Era) by Ferdinand Verbiest (Nan Huairen). This work represents the astronomical and calendrical reforms introduced by the Jesuit missionaries in China during the early Qing dynasty.",
    subjects: ["Astronomy", "Calendar", "Qing Dynasty", "Jesuit Missions"],
    category: "astronomy",
    manifestUrl: publicManifestUrl("bnf_bpt6k98181886.json"),
    museumUrl: "https://gallica.bnf.fr/ark:/12148/bpt6k98181886",
    thumbnailUrl: "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k98181886/f30/full/300,/0/default.jpg",
    logoUrl: "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    pageCount: 552,
    institution: "Bibliothèque nationale de France",
    attribution: "Bibliothèque nationale de France",
    language: ["Chinese"],
    authors: ["Ferdinand Verbiest"],
    shelfmark: "CHINOIS-5005",
    hasIllustrations: true,
  },
  {
    id: "53988940",
    title: "Xin zhi ling tai yi xiang zhi",
    navDate: "1674-01-01T00:00:00Z",
    year: 1674,
    dynasty: "Qing",
    description: "Xin zhi ling tai yi xiang zhi (Records of the Newly Built Instruments at the Observatory) by Ferdinand Verbiest. This monumental work describes the astronomical instruments constructed for the Beijing Ancient Observatory under the supervision of Verbiest for the Kangxi Emperor.",
    subjects: ["Astronomy", "Scientific Instruments", "Observatory", "Qing Dynasty"],
    category: "astronomy",
    manifestUrl: publicManifestUrl("harvard_53988940.json"),
    museumUrl: "https://hollis.harvard.edu/primo-explore/search?query=any,contains,53988940&vid=HVD2",
    thumbnailUrl: "https://ids.lib.harvard.edu/ids/iiif/53990254/full/300,/0/default.jpg",
    logoUrl: "https://iiif.lib.harvard.edu/static/manifests/harvard_logo.jpg",
    pageCount: 835,
    institution: "Harvard University",
    attribution: "Harvard University Library",
    language: ["Chinese"],
    authors: ["Ferdinand Verbiest"],
    shelfmark: "53988940",
    hasIllustrations: true,
  },
  {
    id: "2014514195",
    title: "Shi wu ben cao hui zuan : shi er juan, tu yi juan",
    navDate: "1691-01-01T00:00:00Z",
    year: 1691,
    dynasty: "Qing",
    description: "Title from caption. In case. Also available in digital form on the Library of Congress Web site. \u6e05\u5eb7\u7199\u9593\u8f09\u8a60\u6a13\u523b\u672c \u56db\u5468\u55ae\u6b04 \u767d\u53e3 \u55ae\u9b5a\u5c3e\uff08\u9593\u6709\u767d\u9b5a\u5c3e\uff09\u7248\u5321\u9ad818.4\u5bec11.2\u516c\u5206. \u4e5d\u884c\u4e8c\u5341\u4e8c\u5b57 \u5c0f\u5b57\u96d9\u884c\u540c\u5b57...",
    subjects: ["Botany", "Medicinal plants", "Chinese medicine"],
    category: "botany",
    manifestUrl: publicManifestUrl("loc_2014514195.json"),
    museumUrl: "https://www.loc.gov/item/2014514195/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:asian:lcnclscd:2014514195:1A000:29b30a/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 61,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Chinese"],
    authors: ["Shen Lilong"],
    shelfmark: "2014514195",
    hasIllustrations: true,
    illustrationCount: 42,
  },
  {
    id: "2006433487",
    title: "Juan huan guan Pei hua ao jue lu : shang juan",
    navDate: "1368-01-01T00:00:00Z",
    year: 1368,
    dynasty: "Ming",
    description: "In case. Also available in digital form on the Library of Congress Web site. Collection of Wang Shunan April 3, 1929 379064. \u518a\u4e8c\u6709\u58a8\u7b46\u8805\u982d\u5c0f\u5b57\u7709\u6279\u65c1\u8a3b. \u684621 x 13\u516c\u5206, 8\u884c19\u5b57, \u767d\u53e3, \u56db\u5468\u96d9\u908a...",
    subjects: ["plant breeding", "china", "flowers", "floriculture"],
    category: "botany",
    manifestUrl: publicManifestUrl("loc_2006433487.json"),
    museumUrl: "https://www.loc.gov/item/2006433487/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:asian:lcnclscd:2006433487:1A000:28b29a/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 36,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Chinese"],
    authors: ["Sun Zhibo"],
    shelfmark: "2006433487",
    hasIllustrations: true,
    illustrationCount: 42,
  },
  {
    id: "2021666851",
    title: "Pedacio Dioscorides Anazarbeo, acerca de la materia medicinal y de los venenos mortiferos",
    navDate: "1555-01-01T00:00:00Z",
    year: 1555,
    dynasty: "Spanish Empire",
    description: "This book exemplifies the transfer of knowledge across the centuries. During the first century, the Greek doctor and apothecary Dioscorides, who is considered the father of pharmacology, wrote a very important document on botany and pharmaceuticals...",
    subjects: ["Pharmacology", "Botany", "Medicinal plants", "Translation"],
    category: "botany",
    manifestUrl: publicManifestUrl("loc_2021666851.json"),
    museumUrl: "https://www.loc.gov/item/2021666851/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:10:63:2:wdl_10632:R_008514-000030_Pg.0015/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 663,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Spanish", "Latin", "Greek"],
    authors: ["Dioscorides Pedanius", "Andr\u00e9s Laguna (Translator)"],
    shelfmark: "2021666851",
    hasIllustrations: true,
    illustrationCount: 600,
  },
  {
    id: "2021667445",
    title: "Ben cao pin hui jing yao",
    navDate: "1505-01-01T00:00:00Z",
    year: 1505,
    dynasty: "Ming",
    description: "Ben cao pin hui jing yao (Collection of the essential medical herbs of materia medica) was compiled and illustrated by imperial order of Emperor Xiaozong (ruled 1487-1505) of the Ming dynasty...",
    subjects: ["Materia medica", "Chinese medicine", "Medicinal plants"],
    category: "botany",
    manifestUrl: publicManifestUrl("loc_2021667445.json"),
    museumUrl: "https://www.loc.gov/item/2021667445/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:13:51:3:wdl_13513:016a/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 104,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Chinese"],
    authors: ["Liu Wentai"],
    shelfmark: "2021667445",
    hasIllustrations: true,
    illustrationCount: 1367,
  },
  {
    id: "2021666395",
    title: "Chong xiu Zhenghe jing shi zheng lei bei yong ben cao",
    navDate: "1468-01-01T00:00:00Z",
    year: 1468,
    dynasty: "Ming",
    description: "The author of this work is the famous Song physician Tang Shenwei, a native of Huayang (in present-day Chengdu, Sichuan province)...",
    subjects: ["Materia medica", "Herbal medicine", "Song dynasty", "Medical literature"],
    category: "botany",
    manifestUrl: publicManifestUrl("loc_2021666395.json"),
    museumUrl: "https://www.loc.gov/item/2021666395/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:11:41:5_:00:1:wdl_11415_001:00030/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 50,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Chinese"],
    authors: ["Tang Shenwei"],
    shelfmark: "2021666395",
    hasIllustrations: true,
  },
  {
    id: "4f104fd5-16b5-4cd6-99b3-9a8f8868d7ff",
    title: "Kitāb al-Ḥashāʼish (Arabic translation of Dioscorides' Materia Medica)",
    navDate: "1240-01-01T00:00:00Z",
    year: 1240,
    dynasty: "Abbasid",
    description: "An illustrated copy of I\u1e63\u1e6dafan ibn Ba\u0304sil's Arabic translation of Books III-V of Dioscorides' Materia Medica. Dioscorides\u2019 Greek treatise on materia medica was translated several times into Arabic.",
    subjects: ["Medicinal plants", "Pharmacology", "Islamic medicine"],
    category: "botany",
    manifestUrl: publicManifestUrl("bod_4f104fd5-16b5-4cd6-99b3-9a8f8868d7ff.json"),
    museumUrl: "https://digital.bodleian.ox.ac.uk/objects/4f104fd5-16b5-4cd6-99b3-9a8f8868d7ff/",
    thumbnailUrl: "https://iiif.bodleian.ox.ac.uk/iiif/image/697107dd-36b8-4fad-bd97-64932d7f59ef/full/300,/0/default.jpg",
    pageCount: 434,
    institution: "Bodleian Libraries",
    attribution: "Photo: \u00a9 Bodleian Libraries, University of Oxford",
    license: "CC BY-NC 4.0",
    language: ["Arabic"],
    authors: ["Is\u1e6dafan Ibn-Ba\u0304sil", "Dioscorides Pedanius"],
    shelfmark: "Bodleian Library MS. Arab. d. 138",
    hasIllustrations: true,
    illustrationCount: 289
  },
  {
    id: "52114",
    title: "Elizabeth Blackwell, A Curious Herbal, Volume 1",
    navDate: "1737-01-01T00:00:00Z",
    year: 1737,
    dynasty: "Georgian",
    description: "A curious herbal, containing five hundred cuts, of the most useful plants, which are now used in the practice of physick. Engraved on folio copper plates, after drawings, taken from the life. By Elizabeth Blackwell.",
    subjects: ["Medicinal plants", "18th century", "Botanical illustration"],
    category: "botany",
    manifestUrl: publicManifestUrl("f1.json"),
    museumUrl: "https://oa-rhs.libnova.com/view/52114",
    thumbnailUrl: "https://oa-rhs.libnova.com/iiif/2/1036209/full/300,/0/default.jpg",
    pageCount: 659,
    institution: "RHS Lindley Collections",
    attribution: "RHS Lindley Collections",
    license: "Public Domain",
    language: ["English"],
    authors: ["Blackwell, Elizabeth (c1700-1758)"],
    shelfmark: "615.3 Bla",
    hasIllustrations: true,
    illustrationCount: 500,
    blobBookId: "52114",
  },
  {
    id: "2002046",
    title: "Voynich Manuscript",
    navDate: "1401-01-01T00:00:00Z",
    year: 1401,
    dynasty: "Renaissance",
    description: "Scientific or magical text in an unidentified language, in cipher, apparently based on Roman minuscule characters. Almost every page contains botanical and scientific drawings.",
    subjects: ["Cipher", "Botanical drawings", "Alchemy"],
    category: "botany",
    manifestUrl: publicManifestUrl("yul_2002046.json"),
    museumUrl: "https://collections.library.yale.edu/catalog/2002046",
    thumbnailUrl: "https://collections.library.yale.edu/iiif/2/1006103/full/300,/0/default.jpg",
    pageCount: 240,
    institution: "Yale University Library",
    attribution: "Beinecke Rare Book and Manuscript Library, Yale University",
    license: "Public Domain",
    language: ["Unidentified"],
    authors: ["Unknown"],
    shelfmark: "Beinecke MS 408",
    hasIllustrations: true
  },
  {
    id: "100452358",
    title: "Man'yo honzo zusetsu (\u842c\u8449\u672c\u8349\u5716\u8b5c)",
    navDate: "1833-01-01T00:00:00Z",
    year: 1833,
    dynasty: "Edo",
    description: "Japanese botanical work illustrating plants mentioned in the Man'yoshu anthology.",
    subjects: ["Botany", "Japanese literature", "Botanical illustration"],
    category: "botany",
    manifestUrl: publicManifestUrl("nijl_100452358.json"),
    museumUrl: "https://kokusho.nijl.ac.jp/biblio/100452358/",
    thumbnailUrl: "https://kokusho.nijl.ac.jp/api/iiif/100452358/v4/TOKY/TOKY-02609/TOKY-02609-00029.tif/full/300,/0/default.jpg",
    pageCount: 150,
    institution: "National Institute of Japanese Literature",
    attribution: "\u6771\u4eac\u5927\u5b66\u7406\u5b66\u7cfb\u7814\u7a76\u79d1\u9644\u5c5e\u690d\u7269\u5712 \u56fd\u6587\u5b66\u7814\u7a76\u8cc7\u6599\u9928",
    license: "https://kokusho.nijl.ac.jp/page/usage.html",
    language: ["Japanese"],
    authors: ["Iwasaki Kan'en"],
    shelfmark: "100452358",
    hasIllustrations: true
  },
  {
    "id": "2575428",
    "title": "紹興校定經史證類備急本草卷3-28. [2]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [2]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575428.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575428",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575428/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 47,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575429",
    "title": "紹興校定經史證類備急本草卷3-28. [3]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [3]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575429.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575429",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575429/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 58,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575427",
    "title": "紹興校定經史證類備急本草卷3-28. [1]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [1]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575427.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575427",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575427/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 39,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575430",
    "title": "紹興校定經史證類備急本草卷3-28. [4]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [4]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575430.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575430",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575430/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 35,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575431",
    "title": "紹興校定經史證類備急本草卷3-28. [5]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [5]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575431.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575431",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575431/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 49,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575432",
    "title": "紹興校定經史證類備急本草卷3-28. [6]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [6]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575432.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575432",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575432/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 38,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575433",
    "title": "紹興校定經史證類備急本草卷3-28. [7]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [7]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575433.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575433",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575433/R0000020/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 28,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575434",
    "title": "紹興校定經史證類備急本草卷3-28. [8]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [8]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575434.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575434",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575434/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 37,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575435",
    "title": "紹興校定經史證類備急本草卷3-28. [9]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [9]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575435.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575435",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575435/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 49,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575436",
    "title": "紹興校定經史證類備急本草卷3-28. [10]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [10]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575436.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575436",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575436/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 49,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575437",
    "title": "紹興校定經史證類備急本草卷3-28. [11]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [11]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575437.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575437",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575437/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 47,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2575438",
    "title": "紹興校定經史證類備急本草卷3-28. [12]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "紹興校定經史證類備急本草卷3-28. [12]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575438.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575438",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575438/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 40,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "宋王繼先等校"
    ],
    "shelfmark": "寄別10-56",
    "hasIllustrations": true,
  },
  {
    "id": "2558704",
    "title": "本草匯18卷補遺1卷圖1卷. [20]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "本草匯18卷補遺1卷圖1卷. [20]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2558704.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2558704",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2558704/R0000020/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 29,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "清郭佩蘭撰"
    ],
    "shelfmark": "特7-495",
    "hasIllustrations": true,
  },
  {
    "id": "2555682",
    "title": "周憲王救荒本草14卷. [1]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [1]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555682.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555682",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555682/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 57,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555683",
    "title": "周憲王救荒本草14卷. [2]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [2]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555683.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555683",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555683/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 69,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555684",
    "title": "周憲王救荒本草14卷. [3]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [3]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555684.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555684",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555684/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 66,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555685",
    "title": "周憲王救荒本草14卷. [4]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [4]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555685.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555685",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555685/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 57,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555686",
    "title": "周憲王救荒本草14卷. [5]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [5]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555686.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555686",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555686/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 71,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555687",
    "title": "周憲王救荒本草14卷. [6]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [6]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555687.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555687",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555687/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 61,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2555688",
    "title": "周憲王救荒本草14卷. [7]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "周憲王救荒本草14卷. [7]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2555688.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2555688",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2555688/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 74,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明徐光啓輯"
    ],
    "shelfmark": "特1-372",
    "hasIllustrations": true,
  },
  {
    "id": "2575872",
    "title": "本草綱目圖3卷. [1]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "本草綱目圖3卷. [1]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575872.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575872",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575872/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 54,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明李時珍撰"
    ],
    "shelfmark": "特1-2298",
    "hasIllustrations": true,
  },
  {
    "id": "2575873",
    "title": "本草綱目圖3卷. [2]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "本草綱目圖3卷. [2]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575873.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575873",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575873/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 58,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明李時珍撰"
    ],
    "shelfmark": "特1-2298",
    "hasIllustrations": true,
  },
  {
    "id": "2575874",
    "title": "本草綱目圖3卷. [3]",
    "navDate": "1000-01-01T00:00:00Z",
    "year": 1000,
    "dynasty": "Edo",
    "description": "本草綱目圖3卷. [3]",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("ndl_2575874.json"),
    museumUrl: "https://dl.ndl.go.jp/pid/2575874",
    "thumbnailUrl": "https://dl.ndl.go.jp/api/iiif/2575874/R0000030/full/300,/0/default.jpg",
    "logoUrl": "https://dl.ndl.go.jp/img/logo/ndldc/iiif-logo.png",
    "pageCount": 59,
    "institution": "National Diet Library",
    "attribution": "国立国会図書館 National Diet Library, JAPAN",
    "language": [
      "Japanese",
      "Chinese"
    ],
    "authors": [
      "明李時珍撰"
    ],
    "shelfmark": "特1-2298",
    "hasIllustrations": true,
  },
  {
    "id": "cc1c2e51-8daf-49e9-b164-618d563d15d5",
    "title": "Bodleian Library MS. Bodl. 130",
    "navDate": "1800-01-01T00:00:00Z",
    "year": 1800,
    "dynasty": "Late Modern",
    "description": "Herbarium. Ex herbis femininis (extracts). Liber medicinae ex animalibus.",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("bod_cc1c2e51-8daf-49e9-b164-618d563d15d5.json"),
    museumUrl: "https://digital.bodleian.ox.ac.uk/objects/cc1c2e51-8daf-49e9-b164-618d563d15d5/",
    "thumbnailUrl": "https://iiif.bodleian.ox.ac.uk/iiif/image/cd7963e7-09b2-49ad-bb8a-a8e6db981c3c/full/300,/0/default.jpg",
    "pageCount": 197,
    "institution": "Bodleian Libraries",
    "attribution": "<span>Photo: © Bodleian Libraries, University of Oxford. Terms of use: <a href=\"https://creativecommons.org/licenses/by-nc/4.0/\">CC BY-NC 4.0</a>. For more information, please see <a href=\"https://digital.bodleian.ox.ac.uk/terms/\">https://digital.bodleian.ox.ac.uk/terms/</a></span>",
    "language": [
      "English"
    ],
    "authors": [
      "Ps.-Dioscorides"
    ],
    "shelfmark": "Bodleian Library MS. Bodl. 130",
    "hasIllustrations": true
  },
  {
    "id": "50049695",
    "title": "Les roses,",
    "navDate": "1817-01-01T00:00:00Z",
    "year": 1817,
    "dynasty": "Late Modern",
    "description": "No flower painter has so linked his name and immortality with a single genus as has Redouté with the rose. This three-volume set is Redouté most famous work; its 170 hand-colored plates are the most frequently reproduced of all botanical images. Pierre Joseph Redouté (1759-1840) was from a Belgian family of painters, and himself served, under various titles, as drawing master to the queens and princesses of France for half a century. Royal or aristocratic patronage was essential for the production of his many costly and lavishly illustrated works. The draftmanship of Redouté was both elegant and botanically accurate; for most viewers he had captured the rose. Shown here is one of only five special copies, printed in large folio format, on ve\u0301lin paper, with a double set of plates, plain and colored, retouched by Redouté himself.",
    "subjects": [
      "Botany",
      "Materia Medica",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("loc_50049695.json"),
    museumUrl: "https://www.loc.gov/item/50049695/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:rbc:rbctos:2018rosen1892v1:0030/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 402,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "French"
    ],
    "authors": [
      "Redouté"
    ],
    "shelfmark": "50049695",
    "hasIllustrations": true,
  },
  {
    "id": "05036274",
    "title": "Elementary botany",
    "navDate": "1905-01-01T00:00:00Z",
    "year": 1905,
    "dynasty": "Late Modern",
    "description": "\"The present book is the result of a revision and elaboration of the author's ʻElementary botany, ̓New York, 1898.\"--Pref. Also available in digital form.",
    "subjects": [
      "Botany",
      "Natural History",
      "Plant Science"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("a1.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/public:gdcmassbookdig:elementarybotan00atki:elementarybotan00atki_0030/full/pct:100.0/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 554,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "English"
    ],
    "authors": [
      "Atkinson, George Francis"
    ],
    "shelfmark": "QK41 .A87 1905",
    "hasIllustrations": true,
  },
  {
    "id": "bpt6k10402533",
    "title": "Traité des arbres fruitiers. T. 1",
    "navDate": "1768-01-01T00:00:00Z",
    "year": 1768,
    "dynasty": "Enlightenment",
    "description": "Traité des arbres fruitiers, contenant leur figure, leur description et leur culture, par Henri-Louis Duhamel du Monceau.",
    "subjects": [
      "Botany",
      "Pomology",
      "Fruit Trees"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("bnf_bpt6k10402533.json"),
    museumUrl: "https://gallica.bnf.fr/ark:/12148/bpt6k10402533",
    "thumbnailUrl": "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k10402533/f30/full/300,/0/default.jpg",
    "logoUrl": "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    "pageCount": 515,
    "institution": "Bibliothèque nationale de France",
    "attribution": "Bibliothèque nationale de France",
    "license": "https://gallica.bnf.fr/html/und/conditions-dutilisation-des-contenus-de-gallica",
    "language": [
      "French"
    ],
    "authors": [
      "Duhamel Du Monceau, Henri-Louis (1700-1782)"
    ],
    "shelfmark": "Bibliothèque nationale de France, département Arsenal, FOL-S-655 (1)",
    "hasIllustrations": true,
  },
  {
    "id": "bpt6k3414705j",
    "title": "Etude de la plante",
    "navDate": "1903-01-01T00:00:00Z",
    "year": 1903,
    "dynasty": "Late Modern",
    "description": "Etude de la plante / M. P. Verneuil.",
    "subjects": [
      "Botany",
      "Plant Studies",
      "Natural History"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("bnf_bpt6k3414705j.json"),
    museumUrl: "https://gallica.bnf.fr/ark:/12148/bpt6k3414705j",
    "thumbnailUrl": "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k3414705j/f30/full/300,/0/default.jpg",
    "logoUrl": "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    "pageCount": 340,
    "institution": "Bibliothèque nationale de France",
    "attribution": "Bibliothèque nationale de France",
    "license": "https://gallica.bnf.fr/html/und/conditions-dutilisation-des-contenus-de-gallica",
    "language": [
      "French"
    ],
    "authors": [
      "Pillard Verneuil, Maurice (1869-1942)"
    ],
    "shelfmark": "Bibliothèque nationale de France, département Sciences et techniques, 2015-272836",
    "hasIllustrations": true,
  },
  {
    "id": "2021667076",
    "title": "Euclid's \"Elements\"",
    "navDate": "1482-01-01T00:00:00Z",
    "year": 1482,
    "dynasty": "Renaissance",
    "description": "Gold leaf often was used to enhance the value of medieval manuscripts. In scriptoria and painters' workshops, highly specialized techniques had been developed to write in golden letters-often on a colored background-or to decorate initials and miniatures with gold. These methods continued to be employed in the manual decoration of printed books. However, the development of a corresponding technique for printing gold on parchment or paper proved to be much more difficult. The first printer to successfully implement this technique was Erhard Ratdolt, a native of Augsburg who worked in Venice from 1475--76 onward. In May 1482, Ratdolt's workshop published the first printed edition of the Elements, the seminal work of the ancient Greek mathematician Euclid. During the Middle Ages, this text was known only in Latin translations from the Arabic and available in numerous manuscripts. As Ratdolt explained in his preface dedicating the work to the Venetian doge, Giovanni Mocenigo (1408--85), printing the geometrical diagrams used in the work presented particular technical difficulties. Seven copies of the edition are known to contain this dedicatory epistle printed in golden letters, one of which Ratdolt donated to the Carmelite monastery in Augsburg in 1484, from where it came to Munich. This copy is presented here. To print the preface in golden letters, Ratdolt developed an innovative technique derived from the methods used by bookbinders to stamp gold on leather. This involved strewing a powdered bonding agent (either resin or dried albumen) onto the page and probably heating the metal type so that the gold-leaf would stick to the paper. For his 1488 edition of the Chronica Hungarorum (Chronicles of the Hungarians), Ratdolt employed a simpler method using golden printing ink. His technique of printing in golden letters was first copied in 1499 by the Venetian printer Zacharias Kallierges.",
    "subjects": [
      "euclid",
      "alexandria",
      "al iskandarīyah",
      "geometry",
      "arithmetic",
      "incunabula",
      "300 b.c",
      "egypt",
      "illuminations",
      "mathematics, greek"
    ],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("loc_2021667076.json"),
    museumUrl: "https://www.loc.gov/item/2021667076/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:18:19:8:wdl_18198:bsb00037426_00030/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 284,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Latin"
    ],
    "authors": [
      "Euclid",
      "Hypsicles"
    ],
    "shelfmark": "2021667076",
    "hasIllustrations": true,
  },
  {
    "id": "2021666487",
    "title": "Ji he yuan ben : Liu juan",
    "navDate": "1606-01-01T00:00:00Z",
    "year": 1606,
    "dynasty": "Ming",
    "description": "Ji he yuan ben (Euclid's Elements) is a version of the work by Greek mathematician Euclid (circa 323-circa 285 BC). Presented here is the earliest Chinese translation, done by Italian Jesuit Matteo Ricci (1552-1610) together with Xu Guangqi. Xu Guangqi (1562-1633), name Zixian, style name Xuanhu, was born in Shanghai. He received his jin shi degree in the 32nd year (1604) of the Wanli reign of Ming and was a vice minister of the Ministry of Rites and a grand secretary of the Wenyuange Imperial Library. He learned astronomy from Ricci, studied agriculture, recommended the reform of the calendar, and wrote Nong zheng quan shu (Complete book on agricultural administration). In 1606 Xu Guangqi recorded Ji he yuan ben, as dictated by Ricci. They used as the basis for their work the 15-volume Latin-language edition of Euclid's Elements, revised and supplemented by Christopher Clavius (1538-1612), of which they succeeded in translating the first six volumes. The Ricci- Xu Guangqi translation brought into China for the first time Euclid's geometry, with its strict logical system and methodology of reasoning. From this translation, the Chinese words for geometry and geometrical terms such as point, line, parallel line, triangle, and square were adopted and are still used today. These terms have also spread to usage in Japan, Korea, and other countries. This is an important work for Chinese scholars studying learning from the West during the Ming and Qing dynasties.",
    "subjects": [
      "geometry",
      "mathematics, greek",
      "300 b.c",
      "chinese literature",
      "china",
      "greece",
      "euclid"
    ],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("loc_2021666487.json"),
    museumUrl: "https://www.loc.gov/item/2021666487/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:17:21:6_:00:1:wdl_17216_001:030/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 69,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Chinese"
    ],
    "authors": [
      "Euclid",
      "Matteo Ricci",
      "Xu Guangqi",
      "Christoph Clavius"
    ],
    "shelfmark": "2021666487",
    "hasIllustrations": true,
  },
  {
    "id": "2021666337",
    "title": "Ji he yuan ben",
    "navDate": "1690-01-01T00:00:00Z",
    "year": 1690,
    "dynasty": "Qing",
    "description": "In 1690, Emperor Kangxi summoned two French missionaries, Zhang Cheng (Jean Francois Gerbillon, 1654--1707) and Bai Jin (Joachim Bouvet, 1656--1730), to Beijing to teach him mathematics. The missionaries initially considered using for this purpose the early 17th-century partial translation by Matteo Ricci (1552--1610) and Xu Guangqi (1562--1633) of Euclid's great work on geometry, Elements, but they found it too complicated. So they decided to translate instead Elements de geometrie by French Jesuit Ignace Gaston Pardies (1636--73), which drew on Euclid, Archimedes, and Apollonius. They gave their work, in seven juan, the same Chinese title, Ji he yuan ben (The elements of geometry), as Ricci and Xu had given their translation of Euclid. This very rare copy is handwritten. There are corrections in ink and numerous paper slips of corrections pasted on pages, and some editorial notes by the translators, one of which reads: \"Zhang Cheng wishes to correct.\" The work was presented to Emperor Kangxi, who added comments of his own in the upper margins. The National Central Library of Taiwan owns another edition of this work, the preface of which notes that the Ricci work was grammatically unclear and difficult to understand, which explains why this translation was made. The text of this other edition is the same as the one translated by Zhang Cheng and Bai Jin, except that it incorporates earlier corrections. Both copies were previously owned by the book collectors Mo Tang (1865--1929) and Wang Yinjia (1892--1949).",
    "subjects": [
      "mathematics",
      "1636 to 1673",
      "jesuits",
      "beijing",
      "china"
    ],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("loc_2021666337.json"),
    museumUrl: "https://www.loc.gov/item/2021666337/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:07:10:3_:00:1:wdl_07103_001:00001/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 14,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Chinese"
    ],
    "authors": [
      "Ignace-Gaston Pardies",
      "Jean-Francois Gerbillon",
      "Joachim Bouvet"
    ],
    "shelfmark": "2021666337",
    "hasIllustrations": true,
  },
  {
    "id": "2021667242",
    "title": "Commentary on the Forms of Foundation",
    "navDate": "1714-01-01T00:00:00Z",
    "year": 1714,
    "dynasty": "Ottoman",
    "description": "This work is a commentary on Ashkāl al-ta'sīs (Forms of foundation), a geometrical tract by Shams al-Dīn Muḥammad b. Ashraf al-Ḥusaynī al-Samarqandī. The author of the commentary, Qāḍīzāda al-Rūmī (Ṣalāh al-Din Mūsā ibn Muḥammad, 1364--1436) was one of the principal astronomers at the celebrated Samarkand observatory. He was a native of Bursa, where his father Maḥmūd served as a prominent judge (hence the appellation Qāḍīzāda, which means \"born to a judge\" in Persian). The commentary was completed in 1412 (814 AH) and, judging from the many surviving copies, was hugely popular. The work is dedicated to Qāḍīzāda's patron, Ulugh Beg, the astronomer and builder of the Samarkand observatory, who served as governor of Transoxiana from 1409 to 1447 and as ruler of Timurid Persia in 1447--49. Ashkāl al-ta'sīs is a treatise on 35 fundamental postulates in the first book of Euclid's Elements. It was widely copied and appears in the holdings of many collections in Europe and Asia. The present manuscript has numerous geometrical figures in red and black ink, containing as well many marginal notes in Arabic. It was completed in 1126 AH (1714--15). Little is known about al-Samarqandī, the author of the work on which Qāḍīzāda wrote his commentary. He was active in the 13th century, and a manuscript currently in Istanbul (Laleli 2432), for which one of al-Samarqandī's students may have served as copyist, states that al-Samarqandī died on the 22nd of Shawwāl, 702 AH (June 9, 1303).",
    "subjects": [
      "mathematics",
      "uzbekistan",
      "euclid",
      "arabic manuscripts",
      "samarqandī, muḥammad ibn ashraf, 13th century"
    ],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("loc_2021667242.json"),
    museumUrl: "https://www.loc.gov/item/2021667242/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:09:54:6:wdl_09546:8340030/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 36,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Arabic"
    ],
    "authors": [
      "Qadizadah Musa ibn Muhammad"
    ],
    "shelfmark": "2021667242",
    "hasIllustrations": true,
  },
  {
    "id": "2021667539",
    "title": "\"Ma'aseh Hoshev\"",
    "navDate": "1450-01-01T00:00:00Z",
    "year": 1450,
    "dynasty": "Late Medieval",
    "description": "This manuscript of Ma'aseh ḥoshev (The art of calculation), one of the most valuable Hebrew codices in the Bavarian State Library, is arranged in 24 separate works or grouped fragments of texts on mathematics, geometry and astronomy, together with a great number of explanatory notes, glosses, and additions. It is hard to do justice in a few words to the very broad range of matters discussed, which, in the disciplines covered, reflect the state of scientific knowledge in the Middle Ages. The work was compiled and mostly written by Levi ben Gershom, also known as Gersonides and by the acronym Ralbag (1288-1344), in 1321. The largest part of the 265 paper leaves is taken up by the works of Euclid, including fragments of his treatises on optics and catoptrics, and especially the Elements, with commentaries by al-Farabi and Ibn al-Haitam translated by Mosheh Ibn Tibon. One of the most important texts is the Mishnat ha-Middot (Theory of measures), held to be the oldest Hebrew work on geometry, which dates from about 150. The manuscript also contains texts by other great Jewish scholars of the Middle Ages, such as Abraham bar Hiyya Savasorda (died circa 1136), Abraham ben Meïr Ibn Esra (1089-1164), Simon Motot (15th century), and Mordecai ben Eliezer Comtino (1420-circa 1487). The main part of the manuscript was transcribed in Constantinople in 1480 by a certain Moses ben David, who mentions his name on folios 100 verso and 173 verso. The manuscript came from the collection of Johann Albrecht Widmannstetter to the ducal court library in Munich, the present-day Bavarian State Library.",
    "subjects": [
      "900 to 1499",
      "istanbul",
      "mathematics, greek",
      "turkey",
      "astronomy",
      "geometry",
      "euclid",
      "science, medieval"
    ],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("loc_2021667539.json"),
    museumUrl: "https://www.loc.gov/item/2021667539/",
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:19:52:4:wdl_19524:bsb00095507_00030/full/300,/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 571,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Hebrew"
    ],
    "authors": [
      "Levi ben Gershom",
      "Euclid",
      "Moses ben David"
    ],
    "shelfmark": "2021667539",
    "hasIllustrations": true,
  },
  {
    "id": "2021666122",
    "title": "Morning Glory Flowers.",
    "navDate": "1854-01-01T00:00:00Z",
    "year": 1854,
    "dynasty": "Edo",
    "description": "This pictorial book from 1854 is known as one of the best books on morning glories published in Japan. It reflects the morning glory mania that began in 1847 and that was widespread among the people of Edo (present-day Tokyo) at that time. The book features colored prints of 36 morning glory flowers and leaves with strange shapes, by Hattori Sessai (1807-?), a Japanese painter known for his naturalist works. The descriptions were written by Bankaen Shujin, also known as Yokoyama Masana (1833-1908), who was a retainer of a Tokugawa shogun.",
    "subjects": [
      "tokyo",
      "1800 to 1899",
      "japan",
      "edo",
      "flowers",
      "picture books"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b1.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:02:94:0:wdl_02940:084-006/full/pct:25/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 26,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Japanese"
    ],
    "authors": [
      "Hattori, Sessai",
      "Yokoyama, Masana"
    ],
    "shelfmark": "2021666122",
    "hasIllustrations": true,
  },
  {
    "id": "2021667416",
    "title": "Annals of Creation",
    "navDate": "0900-01-01T00:00:00Z",
    "year": 900,
    "dynasty": "Medieval",
    "description": "The cover of this work by an unknown author bears the title Translation of the Entire Text of the \"Yao Annals of Creation.\" In this bilingual text, the Dongba text is in color and the Chinese text is in black. The Dongba glyphs are ancient characters that were used to record the dialect of the western Naxi nationality centered around the Li River in Yunnan. They were developed in approximately the seventh century. The Annals of Creation reflect the understanding of the Naxi people concerning the natural world and the origins of humankind, and depict the Naxi people's ceaseless migrations over the course of their history and the struggle of their ancestors against nature. This work vividly portrays, in bright images, Chaozeng Li'en, the ancestor of the Naxi people, and his wife, Chenhong Baobai. The work overflows with admiration for the wisdom and heroism of the ancestors, intertwined with descriptions of faithful love. While recording Naxi history and traditional culture, the book also indirectly reflects the social life, religious philosophy, and matrimonial mores of the time. The work, which can truly be called a heroic epic, is not only representative of Dongba literature, but also an important classic of the Dongba religion, with great historical value.",
    "subjects": [
      "yunnan province",
      "ancestor worship",
      "600 to 999",
      "naxi (chinese people)",
      "china",
      "dongba script",
      "naxi manuscripts"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b2.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:03:02:5:wdl_03025:022/full/pct:12.5/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 37,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Naxi",
      "Chinese"
    ],
    "authors": [
      "Unknown"
    ],
    "shelfmark": "2021667416",
    "hasIllustrations": true,
  },
  {
    "id": "2021667602",
    "title": "Itinerary Book Kept During the Journey to East India, from October 18, 1746 to June 20, 1749",
    "navDate": "1746-01-01T00:00:00Z",
    "year": 1746,
    "dynasty": "Enlightenment",
    "description": "From 1746 to 1749, the Swedish rigged brig Götha Lejon sailed on a mercantile mission to Canton. Several accounts of what transpired have survived. This handwritten journal, compiled by Carl Johan Gethe, recounts the long journey to and from Canton and relates Gethe's impressions of Cadiz, Canton, Santa Cruz de Tenerife, and Java. The journal includes astute observations of daily life, descriptions of local customs and the great variety of forms of the Chinese language, and reflections on the journey itself, as well as an enthralling account of the flora and fauna encountered on the voyage. The captain of the Götha Lejon was Bengt Askbom. The journal of Carl Fredrik von Schantz (1727-92) provides another view of the same mission to Canton.",
    "subjects": [
      "indonesia",
      "guangzhou",
      "andalucía",
      "china",
      "guangdong province",
      "tenerife",
      "diaries",
      "spain",
      "canary islands",
      "java",
      "1746 to 1749",
      "description and travel",
      "götha leijon, ship",
      "east india company",
      "cádiz",
      "canton",
      "trading companies"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b3.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:03:04:0:wdl_03040:0045/full/pct:12.5/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 225,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Swedish"
    ],
    "authors": [
      "Gethe, Carl Johan"
    ],
    "shelfmark": "2021667602",
    "hasIllustrations": true,
  },
  {
    "id": "2021667659",
    "title": "Ottheinrich Bible.",
    "navDate": "1430-01-01T00:00:00Z",
    "year": 1430,
    "dynasty": "Late Medieval",
    "description": "The Ottheinrich Bible is the earliest surviving illustrated manuscript of the New Testament in the German language. The work was commissioned around 1430 by Ludwig VII, the Bearded, Duke of Bavaria-Ingolstadt. The text was written, presumably in Ingolstadt, in a monumental script consistent with the highest calligraphic standards. The text was then sent to Regensburg for illumination. Only about one-fifth of the miniatures were completed, however, before work was stopped. Sometime before 1530, the Count Palatine Ottheinrich acquired the Bible and commissioned the artist Mathis Gerung to complete the sequence of miniatures, which previously extended only as far as the Gospel of St. Mark. Gerung finished the work in 1530--31. In all, this magnificently illuminated Bible contains 146 miniatures and 294 ornamented initials on 307 parchment leaves. The manuscript was later taken as war booty from Heidelberg to Munich and then to Gotha, where in the 19th century it was split into eight volumes. The Bavarian State Library acquired three of these volumes in 1950, and the remaining five in 2007.",
    "subjects": [
      "bavaria",
      "illuminations",
      "bible. new testament",
      "1430 to 1531",
      "bible",
      "germany",
      "miniatures (illuminations)"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b4.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:04:10:6_:00:1:wdl_04106_001:bsb00021200_00029/full/pct:6.25/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 83,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "German"
    ],
    "authors": [
      "Ludwig VII, der Bärtige"
    ],
    "shelfmark": "2021667659",
    "hasIllustrations": true,
  },
  {
    "id": "2021667788",
    "title": "Illustrated Book of Thai Poetry.",
    "navDate": "1850-01-01T00:00:00Z",
    "year": 1850,
    "dynasty": "Late Modern",
    "description": "The poems collected in this remarkable Thai manuscript from the second half of the 19th century are by an unknown poet. They all share the same theme: the loss of a beloved woman. Drawing upon all the possible degrees of refinement that the Thai language, poetry, and art can master, each poem is a work of art in itself, praising the beauty of the beloved woman and mourning her passing. Preceding the poems are 13 illustrations connected to the overall theme. They show mythological creatures and motifs from Thai legends and stories, such as Kinnarī (mythical half-birds) or the figure Phra Ram, the hero of the Thai Ramayana. The manuscript is at the Bavarian State Library in Munich, Germany.",
    "subjects": [
      "thai poetry",
      "thailand",
      "poetry",
      "love",
      "mythology",
      "illuminations",
      "1850 to 1899",
      "legends"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b5.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:08:96:5:wdl_08965:bsb00040571_00007/full/pct:6.25/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 60,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Thai"
    ],
    "authors": [
      "Unknown"
    ],
    "shelfmark": "2021667788",
    "hasIllustrations": true,
  },
  {
    "id": "2021667837",
    "title": "General History of the Things of New Spain by Fray Bernardino de Sahagún: The Florentine Codex.",
    "navDate": "1577-01-01T00:00:00Z",
    "year": 1577,
    "dynasty": "Renaissance",
    "description": "Historia general de las cosas de nueva España (General history of the things of New Spain) is an encyclopedic work about the people and culture of central Mexico compiled by Fray Bernardino de Sahagún (1499--1590), a Franciscan missionary who arrived in Mexico in 1529, eight years after completion of the Spanish conquest by Hernan Cortés. Commonly called the Florentine Codex, the manuscript came into the possession of the Medici no later than 1588 and is now in the Medicea Laurenziana Library in Florence. Sahagún began conducting research into indigenous cultures in the 1540s, using a methodology that scholars consider to be a precursor to modern anthropological field technique. His motives were primarily religious: he believed that to convert the natives to Christianity and eradicate their devotion to false gods, it was necessary to understand those gods and the hold they had on the Aztec people. Sahagún was repelled by much of native culture, but he also came to admire many qualities of the Aztecs. As he wrote in the prologue to Book I of his work, the Mexicans \"are held to be barbarians and of very little worth; in truth, however, in matters of culture and refinement, they are a step ahead of other nations that presume to be quite politic.\" Sahagún gained the assistance of two important indigenous groups: the elders of a number of towns in central Mexico (principales) and Nahua students and former students at the College of Santa Cruz in Tlatelolco, where Sahagún worked for much of his time in Mexico. The principales answered questionnaires prepared by Sahagún about their culture and religion, and their responses were recorded in their own pictorial form of writing. The Nahua students interpreted the images and expanded the answers, phonetically transcribing Nahuatl using Latin letters. Sahagún then reviewed the Nahuatl text and added his own Spanish translation. The whole process took almost 30 years and finally was completed in 1575--77, when Sahagún had a new and complete copy of the manuscript prepared. It then was taken to Spain by Fray Rodrigo de Sequera, commissary general of the Franciscans and a supporter of Sahagún's work. The 12 books of the codex originally were bound in four volumes but later rebound into three. The work is arranged in two columns: on the right is the original Nahuatl text, on the left is Sahagún's Spanish translation. The 2,468 magnificent illustrations, made by the students, are mostly in the left-hand column, where the text is shorter. The illustrations combine the syntactic and symbolic traits of the ancient Nahua tradition of painting-writing with the formal qualities of European Renaissance painting.",
    "subjects": [
      "mexico",
      "florentine codex",
      "indigenous peoples",
      "aztec gods",
      "mesoamerica",
      "aztecs",
      "rituals",
      "natural history",
      "clothing and dress",
      "aztec mythology",
      "codex",
      "indians of mexico",
      "1300 to 1577"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b6.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:10:09:6_:00:1:wdl_10096_001:MedPalat218_01_0034/full/pct:6.25/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 729,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Spanish",
      "Nahuatl"
    ],
    "authors": [
      "Sahagún, Bernardino de"
    ],
    "shelfmark": "2021667837",
    "hasIllustrations": true,
  },
  {
    "id": "2021667232",
    "title": "Collection of Poems by Jāmī.",
    "navDate": "1500-01-01T00:00:00Z",
    "year": 1500,
    "dynasty": "Late Medieval",
    "description": "This work dating from the 16th century is an illuminated and illustrated copy of the first collection of poetry (called Dīvān-i avval or Fātihat al-shabāb) by Nūr al-Dīn 'Abd al-Rahmān Jāmī (1414--92), a great Persian poet, scholar, and mystic, who lived most of his life in Herat, in present-day Afghanistan. According to the colophon (folio 306a), the manuscript was copied by the illustrious Safavid calligrapher Shāh Mahmūd Nīshāpūrī, who died in the mid-1560s. The codex opens with a double-page illustrated frontispiece followed by a double-page illuminated incipit. There are ten additional paintings that appear to be later than the text itself and are in the style of Isfahan in the 17th century. The text block, which has been trimmed, is bound in lacquer boards decorated with hunting scenes and landscape motifs. The binding was also executed in Iran and dates from the late 16th--17th centuries. There are several erased seals and one ownership statement on folio 1a, and a seal impression naming Muhammad Amīn is found on folio 3a.",
    "subjects": [
      "iran, islamic republic of",
      "1414 to 1492",
      "library of congress afghanistan project",
      "poetry",
      "codex",
      "afghanistan",
      "calligraphy, persian",
      "illuminations",
      "persian poetry"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b7.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:09:20:7:wdl_09207:W640_000006_300/full/pct:12.5/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 625,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Persian"
    ],
    "authors": [
      "Jāmī",
      "Shāh Maḥmūd Nīshābūrī"
    ],
    "shelfmark": "2021667232",
    "hasIllustrations": true,
  },
  {
    "id": "2021667882",
    "title": "On Plants.",
    "navDate": "1395-01-01T00:00:00Z",
    "year": 1395,
    "dynasty": "Late Medieval",
    "description": "Historia Plantarum (On plants) is a natural science encyclopedia, in which animals, plants, and minerals are illustrated and described for their medicinal properties, in keeping with the medieval tradition of the tacuina medievali (medieval health handbooks), and from which the codex derives its most common name, Tacuinum sanitatis. The work was first compiled as Taqwim al-Sihhah (The maintenance of health) by the 11th-century Baghdad physician Ibn Buṭlān, and chief among his Greek sources was Dioscorides, a physician in the first century. The court in Sicily commissioned a Latin translation in the mid-13th century. The work is divided into sections ordered alphabetically, each of which is decorated with precious architectural motifs that intersect like branches stippled with gold. The text is illustrated with splendid miniatures that were executed in the Northern Italian Lombard style predominantly used by Giovannino and Salomone de' Grassi. The illustrations show animals, plants, minerals, and utensils, painted in watercolors or simply drawn, located at the top of the manuscript pages. The first entry of each alphabetic section is adorned with a decorative first letter that usually includes in its center figures of learned men or physicians. These are represented in half-length figures, framed with ornamental friezes and architectural motifs as well as figures of animals and humans. The initial letters of each chapter are illuminated in gold on a blue background; plain initial letters and paragraph signs are painted in red and blue. Many pages are decorated with phytomorphic and zoomorphic motifs. The codex was created at the Visconti court in Milan for King Wenceslas IV, who was born into the House of Luxembourg, ruled Bohemia from 1378 until his death in 1419, was king of Germany 1376--1400, and was emperor-elect (but not emperor) of the Holy Roman Empire. Duke Giangaleazzo Visconti gave it to Wenceslas circa 1396--97. On folio 1r, on a mosaic blue background, a rather large portrait depicts Wenceslas among the six electors of the Holy Roman Empire, surrounded by the three theological and the four cardinal virtues. At the center of the bottom margin on the same page, an illumination of the coat of arms of King Matthias Corvinus of Hungary (reigned 1458--90) is superimposed on the original coat of arms of the House of Luxembourg. Corvinus inherited the codex and added it to his library in Buda, which became known as the Bibliotheca Corviniana, and had his own workshop of miniaturists insert his coat of arms. Of the original binding, executed in the workshop of Buda's scriptorium at the end of the 15th century, only a few traces remain. When the Corvinus herbal was acquired by the Bibliotheca Casanatense is not known. There is no catalog of the original collection of manuscripts that belonged to Cardinal Girolamo Casanate. However, the total absence of a history of the Tacuinum from the death of Casanate in 1700 until 1744, the year in which it first appeared in the index of Casantense manuscripts compiled by the Dominican fathers, could indicate that it came from the cardinal's collection.",
    "subjects": [
      "miniatures (illuminations)",
      "herbals",
      "italy",
      "500 to 1400",
      "medicine, medieval",
      "minerals",
      "medicinal plants",
      "codex",
      "animals",
      "medicine, greek and roman",
      "illuminations"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b8.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:11:56:0:wdl_11560:ms459c_033v/full/pct:12.5/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 593,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Latin"
    ],
    "authors": [
      "Dioscorides Pedanius",
      "Giovannino de' Grassi",
      "Salomone de' Grassi"
    ],
    "shelfmark": "2021667882",
    "hasIllustrations": true,
  },
  {
    "id": "2021666418",
    "title": "The Insect Book.",
    "navDate": "1788-01-01T00:00:00Z",
    "year": 1788,
    "dynasty": "Edo",
    "description": "Ehon mushi-erami (The insect book) is by the ukiyo-e painter Kitagawa Utamaro (circa 1753-1806). It was created by him before he produced the bijin-ga (pictures of beautiful women) for which he is famous. Each double page of the book contains a painted illustration of a plant and two species of insects, along with two kyōka (a poem style originating from waka, literally, Japanese poems). The kyōka are ostensibly insect-themed love poems. In all, 15 colored wood-block prints are included. The work demonstrates Utamaro's skill at drawing, as well as the high-quality printing techniques of the day. The book was published by Tsutaya Juzaburō (1750-97), a press mogul in the late Edo period (1600-1868).",
    "subjects": [
      "plants",
      "ukiyo-e",
      "block printing",
      "japan",
      "flowers",
      "insects",
      "poetry",
      "japanese poetry"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("b9.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:11:83:2:wdl_11832:1288345_R0000007/full/pct:12.5/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 22,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "Japanese"
    ],
    "authors": [
      "Kitagawa, Utamaro"
    ],
    "shelfmark": "2021666418",
    "hasIllustrations": true,
  },
  {
    "id": "131EAA3A",
    "title": "[Der Lauf der Planeten]",
    "navDate": "1575-01-01T00:00:00Z",
    "year": 1575,
    "dynasty": "Renaissance",
    "description": "Je Bl.: ähnliches Grundbild (Mater) mit Wappen Thurneissers, mit den astrologischen Häusern u.alchemistischen Instrumenten. Darauf mit Faden befestigt drehbare Scheiben (Reten), die Gradeinteilung, Sternenbilder, Tierkreiszeichen etc. darstellen u. Zeiger vgl. \"Die Welt in Händen\", Staatsbiblioth. Berlin, 1989 S. 17 und \"Kartographische Zimelien\", hrsg. Öster. Nationalbibl., 1995, S. 66/67 7 Planeten: Sonne, Mond, Merkur, Saturn, Jupiter, Venus, Mars und \"Lauf\" des Menschen von Geburt und Tod Auf der Rückseite des Astrolabiums \"Mensch\" befindet sich der handschriftliche Hinweis von Peter Lambeck: \"Ex Augustissima Bibliotheca Caesarea Vindobonensi\".",
    "subjects": [
      "Astrolabium",
      "Altkarte"
    ],
    "category": "astronomy",
    "manifestUrl": publicManifestUrl("astronomy_3.json"),
    "thumbnailUrl": "https://api.onb.ac.at/iiif/image/v3/131EAA3A/uk4nGb4kQHe3msaH/full/max/0/default.jpg",
    "logoUrl": "https://api.onb.ac.at/logo.png",
    "pageCount": 17,
    "institution": "Austrian National Library",
    "attribution": "Austrian National Library",
    "language": [
      "German"
    ],
    "authors": [
      "Thurneysser zum Thurn, Leonhardt",
      "Amman, Jost"
    ],
    "shelfmark": "K I 97080 KAR MAG",
    "hasIllustrations": true,
  },
  {
    "id": "2021670764",
    "title": "Thurneisser's \"Astrolabium\".",
    "navDate": "1575-01-01T00:00:00Z",
    "year": 1575,
    "dynasty": "Renaissance",
    "description": "The Archidoxa (1569), a collection of astrological ideas and predictions, is one of the most famous works of Leonhard Thurneisser (or Thurneysser, circa 1530-96), a scholar with broad scientific knowledge, whose involvement in alchemy brought denunciation from some fellow scientists. As an addition to Archidoxa, in 1575 Thurneisser published the Astrolabium. The astrolabe had revolving discs showing constellations and other features of the heavens that were meant to determine the course of the planets and their influences. In theory, it enabled the user to predict his fate or natural disasters. This book was used to create individual horoscopes with the aid of volvelles (wheel charts). The engraving of the work has been attributed to Peter Hille. Each leaf has a large horoscopic diagram as its central feature, surrounded by detailed and intricate decoration featuring the attributes and chemical equipment of Thurnneisser's principal enterprise, with two shields on either side at the head of the diagram featuring figures related to the planet involved--with this last exception all sheets are alike. The entire display is headed by boxed explanatory text. Each of the hand-colored plates in the work contains a different constellation and Des Menschen Cirkel und Lauff (Man's circle of life) with up to six wheel charts depicting the fixed stars and a Baum des Lebens (Tree of life).",
    "subjects": [
      "astrolabes",
      "astrology",
      "zodiac",
      "constellations",
      "germany"
    ],
    "category": "astronomy",
    "manifestUrl": publicManifestUrl("astronomy_4.json"),
    "thumbnailUrl": "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:15:13:1:wdl_15131:00000028/full/pct:3.125/0/default.jpg",
    "logoUrl": "https://loc.gov/static/images/logo-loc-new-branding.svg",
    "pageCount": 96,
    "institution": "Library of Congress",
    "attribution": "Provided by the Library of Congress",
    "language": [
      "German"
    ],
    "authors": [
      "Thurneisser zum Thurn, Leonhard",
      "Hille, Peter"
    ],
    "shelfmark": "2021670764",
    "hasIllustrations": true,
  },
  {
    "id": "btv1b525002505",
    "title": "BnF. Département des Manuscrits. Grec 2179",
    "navDate": "0850-01-01T00:00:00Z",
    "year": 850,
    "dynasty": "Early Medieval",
    "description": "Grec 2179, a Greek manuscript of Dioscorides' Materia Medica held by the Bibliothèque nationale de France.",
    "subjects": [],
    "category": "botany",
    "manifestUrl": publicManifestUrl("c1.json"),
    "thumbnailUrl": "https://gallica.bnf.fr/ark:/12148/btv1b525002505.thumbnail",
    "logoUrl": "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    "pageCount": 358,
    "institution": "Bibliothèque nationale de France",
    "attribution": "Bibliothèque nationale de France",
    "license": "https://gallica.bnf.fr/html/und/conditions-dutilisation-des-contenus-de-gallica",
    "language": [
      "Greek"
    ],
    "authors": [
      "Dioscorides"
    ],
    "shelfmark": "Bibliothèque nationale de France. Département des Manuscrits. Grec 2179",
    "hasIllustrations": true,
  },
  {
    "id": "3641757",
    "title": "Kitāb al-Ḥašāʾiš fī hāyūlā al-ʿilāg ̌al-ṭibbī (Or. 289)",
    "navDate": "1083-01-01T00:00:00Z",
    "year": 1083,
    "dynasty": "Medieval",
    "description": "Arabic translation of Dioscurides, Peri hulēs iatrikēs, more commonly known as the Materia medica. The work was originally translated from Greek into Arabic via Syriac by Ḥunayn b. Isḥāq (810-873) with the collaboration of Stephanus b. Bāsīl between 847-861 CE. This translation was slightly revised by Ḥusayn b. Ibrāhīm al-Nātilī in 990-991 CE. The current copy is based on an exemplar in the hand of al-Nātilī. The work was offered to the amīr of Samarqand, Abū ʿAlī al-Simǧūrī.",
    "subjects": [
      "Manuscripts"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("leiden_3641757.json"),
    "thumbnailUrl": "https://iiifviewer.universiteitleiden.nl/logo/",
    "logoUrl": "https://iiifviewer.universiteitleiden.nl/logo/",
    "pageCount": 697,
    "institution": "Leiden University Libraries",
    "attribution": "Full access. The rights status of this resource is public domain",
    "language": [
      "Arabic",
      "Greek"
    ],
    "authors": [
      "Dioscorides Pedanius",
      "Ḥunayn b. Isḥāq al-ʿIbādī",
      "Stephanus b. Bāsīl",
      "Nātilī, Ḥusayn b. Ibrāhīm al-"
    ],
    "shelfmark": "Or. 289",
    "hasIllustrations": true,
  },
  {
    "id": "btv1b84262821",
    "title": "BnF. Département des Manuscrits. Latin 6862",
    "navDate": "0850-01-01T00:00:00Z",
    "year": 850,
    "dynasty": "Early Medieval",
    "description": "Anonyme, De ponderibus medicinalibus (3r). Pseudo-Hippocrates latinus, Epistola ad Maecenatem (3v-5v). Antonius Musa, Epistola de herba vetonica (19-22v). Pseudo-Apuleius, Herbarius (sive Liber de nominibus et virtutibus herbarum) et Pseudo-Dioscorides, De herbis femininis (22v-63v).",
    "subjects": [],
    "category": "botany",
    "manifestUrl": publicManifestUrl("c3.json"),
    "thumbnailUrl": "https://gallica.bnf.fr/ark:/12148/btv1b84262821.thumbnail",
    "logoUrl": "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    "pageCount": 146,
    "institution": "Bibliothèque nationale de France",
    "attribution": "Bibliothèque nationale de France",
    "license": "https://gallica.bnf.fr/html/und/conditions-dutilisation-des-contenus-de-gallica",
    "language": [
      "Latin"
    ],
    "authors": [
      "Pseudo-Hippocrates",
      "Antonius Musa",
      "Pseudo-Apuleius",
      "Pseudo-Dioscorides"
    ],
    "shelfmark": "Bibliothèque nationale de France. Département des Manuscrits. Latin 6862",
    "hasIllustrations": true,
  },
  {
    "id": "btv1b52505781g",
    "title": "BnF. Département des Manuscrits. Chinois 5563",
    "navDate": "1637-01-01T00:00:00Z",
    "year": 1637,
    "dynasty": "Ming",
    "description": "天工開物 Tian gong kai wu. Traités des industries diverses.",
    "subjects": [],
    "category": "mathematics",
    "manifestUrl": publicManifestUrl("c4.json"),
    "thumbnailUrl": "https://gallica.bnf.fr/ark:/12148/btv1b52505781g.thumbnail",
    "logoUrl": "https://gallica.bnf.fr/mbImage/logos/logo-bnf.png",
    "pageCount": 417,
    "institution": "Bibliothèque nationale de France",
    "attribution": "Bibliothèque nationale de France",
    "license": "https://gallica.bnf.fr/html/und/conditions-dutilisation-des-contenus-de-gallica",
    "language": [
      "Chinese"
    ],
    "authors": [
      "Song Yingxing"
    ],
    "shelfmark": "Bibliothèque nationale de France. Département des Manuscrits. Chinois 5563",
    "hasIllustrations": true,
  },
  {
    "id": "Chig.F.VII.159",
    "title": "Chig.F.VII.159",
    "navDate": "1450-01-01T00:00:00Z",
    "year": 1450,
    "dynasty": "Late Medieval",
    "description": "Vatican Library manuscript Chig.F.VII.159.",
    "subjects": [],
    "category": "botany",
    "manifestUrl": publicManifestUrl("c5.json"),
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Chig.F.VII.159/cover/cover.jpg",
    "logoUrl": "https://digi.vatlib.it/resource/img/i/DVL_logo.jpg",
    "pageCount": 511,
    "institution": "Biblioteca Apostolica Vaticana",
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "language": [
      "Greek"
    ],
    "authors": [
      "Unknown"
    ],
    "shelfmark": "Chig.F.VII.159",
    "hasIllustrations": true,
  },
  {
    "id": "Vat.gr.284",
    "title": "Vat.gr.284",
    "navDate": "0950-01-01T00:00:00Z",
    "year": 950,
    "dynasty": "Early Medieval",
    "description": "Vatican Library manuscript Vat.gr.284.",
    "subjects": [],
    "category": "botany",
    "manifestUrl": publicManifestUrl("c6.json"),
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Vat.gr.284/cover/cover.jpg",
    "logoUrl": "https://digi.vatlib.it/resource/img/i/DVL_logo.jpg",
    "pageCount": 598,
    "institution": "Biblioteca Apostolica Vaticana",
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "language": [
      "Greek"
    ],
    "authors": [
      "Hase, Charles Benoît"
    ],
    "shelfmark": "Vat.gr.284",
    "hasIllustrations": true,
  },
  {
    "id": "Sel.2.81",
    "title": "De historia stirpium commentarii insignes",
    "navDate": "1542-01-01T00:00:00Z",
    "year": 1542,
    "dynasty": "Renaissance",
    "description": "Fuch’s herbal is regarded as perhaps the most beautiful of all printed herbals; with over 500 woodcuts, many of the illustrations are based on plants grown in Fuchs’s own garden. The 54 surviving hand-coloured copies of the first edition, as here, were coloured according to his own specific guidelines, and based on a set of original drawings now lost. This copy also bears annotations by an early English owner, adding the vernacular names for many plants.",
    "subjects": [
      "Botany -- Pictorial works -- Early works to 1800",
      "Botany -- Pre-Linnean works",
      "Botany, Medical -- Early works to 1800"
    ],
    "category": "botany",
    "manifestUrl": publicManifestUrl("c7.json"),
    "thumbnailUrl": "https://images.lib.cam.ac.uk/iiif/PR-SEL-00002-00081-000-00001.jp2/full/300,/0/default.jpg",
    "logoUrl": "https://cudl.lib.cam.ac.uk/themeui/theme/images/logo.svg",
    "pageCount": 939,
    "institution": "Cambridge University Library",
    "attribution": "Provided by Cambridge University Library. Cambridge University Library Images made available for download are licensed under a Creative Commons Attribution-NonCommercial 4.0 Unported License (CC-BY-NC 3.0) This metadata is licensed under a Creative Commons Attribution-NonCommercial 4.0 Unported License.",
    "language": [
      "Latin",
      "German",
      "Greek"
    ],
    "authors": [
      "Fuchs, Leonhart"
    ],
    "shelfmark": "Sel.2.81",
    "hasIllustrations": true,
  },

  // ── f2: Vatican Library, Chig.F.VII.159 ──────────────────
  {
    id: "Chig-F-VII-159",
    title: "Manuscript Chig.F.VII.159",
    navDate: "1400-01-01T00:00:00Z",
    year: 1400,
    dynasty: "Renaissance",
    description: "A 15th-century Greek manuscript from the Chigi collection of the Biblioteca Apostolica Vaticana. The codex is a botanical or medicinal manuscript in the classical Greek tradition, preserving ancient knowledge of plants and natural remedies through the Renaissance period.",
    subjects: ["Greek manuscripts", "Botany", "Herbals", "Renaissance"],
    category: "botany",
    manifestUrl: publicManifestUrl("f2.json"),
    museumUrl: "https://digi.vatlib.it/mss/detail/Chig.F.VII.159",
    thumbnailUrl: "https://digi.vatlib.it/pub/digit/MSS_Chig.F.VII.159/cover/cover.jpg",
    pageCount: 44,
    institution: "Biblioteca Apostolica Vaticana",
    attribution: "Images Copyright Biblioteca Apostolica Vaticana",
    language: ["Greek"],
    authors: ["Unknown"],
    shelfmark: "Chig.F.VII.159",
    hasIllustrations: true,
  },

  // ── f3: Library of Congress, Florentine Codex ────────────
  {
    id: "2021667837",
    title: "General History of the Things of New Spain (Florentine Codex)",
    navDate: "1577-01-01T00:00:00Z",
    year: 1577,
    dynasty: "Colonial Mexico",
    description: "Historia general de las cosas de nueva España (General History of the Things of New Spain), compiled by Franciscan friar Bernardino de Sahagún between 1545 and 1590. This encyclopedic work documents Aztec culture, religion, natural history, flora and fauna of central Mexico, compiled with the help of indigenous Nahuatl-speaking informants. The Florentine Codex is one of the most important sources on pre-Columbian Mesoamerican civilisation.",
    subjects: ["Aztec culture", "Natural history", "Mesoamerica", "Ethnobotany", "Indigenous plants", "Colonial Mexico"],
    category: "botany",
    manifestUrl: publicManifestUrl("f3.json"),
    museumUrl: "https://www.loc.gov/item/2021667837/",
    thumbnailUrl: "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:10:09:6_:00:1:wdl_10096_001:MedPalat218_01_0034/full/300,/0/default.jpg",
    logoUrl: "https://loc.gov/static/images/logo-loc-new-branding.svg",
    pageCount: 729,
    institution: "Library of Congress",
    attribution: "Provided by the Library of Congress",
    language: ["Nahuatl", "Spanish"],
    authors: ["Bernardino de Sahagún"],
    shelfmark: "2021667837",
    hasIllustrations: true,
  },

  // ── f5: RHS Lindley Library, Cours de botanique ──────────
  {
    id: "402647",
    title: "Cours de botanique",
    navDate: "1787-01-01T00:00:00Z",
    year: 1787,
    dynasty: "French Ancien Régime",
    description: "Cours de botanique by Pierre Philippe Alyon (1746–1816), published in Paris in 1787–1788. The work comprises seven livraisons containing 103 hand-coloured, unnumbered etchings of plants. Each plate bears the French vernacular name of the plant as its main title, accompanied by Latin synonyms and a description in French, making it both a scientific reference and a work of fine botanical art.",
    subjects: ["Botany", "Botanical illustration", "18th century", "French botany"],
    category: "botany",
    manifestUrl: publicManifestUrl("f5.json"),
    museumUrl: "https://oa-rhs.libnova.com/view/402647",
    thumbnailUrl: "https://oa-rhs.libnova.com/thumbnail/402647",
    pageCount: 314,
    institution: "Royal Horticultural Society Lindley Library",
    attribution: "Royal Horticultural Society Lindley Library",
    license: "Public Domain",
    language: ["French"],
    authors: ["Alyon, Pierre Philippe (1746-1816)"],
    shelfmark: "581 Aly",
    hasIllustrations: true,
    illustrationCount: 103,
    blobBookId: "8c37eed9edbb2458",
  },

  // ── f6: RHS Lindley Library, Curious Herbal Vol. 2 ───────
  {
    id: "120821",
    title: "Elizabeth Blackwell, A Curious Herbal, Volume 2",
    navDate: "1739-01-01T00:00:00Z",
    year: 1739,
    dynasty: "Georgian",
    description: "Volume 2 of A Curious Herbal by Elizabeth Blackwell (c.1700–1758), published in London by John Nourse, 1737–1739. This companion volume to the first contains plates 253–500 of Blackwell's celebrated series of 500 hand-coloured copper engravings of medicinal plants, drawn from life. The work was produced while Blackwell's husband was imprisoned for debt, and it secured his release through its commercial success.",
    subjects: ["Medicinal plants", "Botanical illustration", "18th century", "British botany"],
    category: "botany",
    manifestUrl: publicManifestUrl("f6.json"),
    museumUrl: "https://oa-rhs.libnova.com/view/120821",
    thumbnailUrl: "https://oa-rhs.libnova.com/thumbnail/120821",
    pageCount: 645,
    institution: "RHS Lindley Collections",
    attribution: "RHS Lindley Collections",
    license: "Public Domain",
    language: ["English"],
    authors: ["Blackwell, Elizabeth (c1700-1758)"],
    shelfmark: "615.3 Bla",
    hasIllustrations: true,
    illustrationCount: 500,
    blobBookId: "be9be1cfaa5b3d01",
  },

  // ── f7: RHS Lindley Library, Herbarum arborum ────────────
  {
    id: "192517",
    title: "Herbarum, arborum, fruticum, frumentorum ac leguminum",
    navDate: "1562-01-01T00:00:00Z",
    year: 1562,
    dynasty: "Holy Roman Empire",
    description: "Herbarum, arborum, fruticum, frumentorum ac leguminum, printed in Frankfurt by the heirs of Chr. Egen in 1562. A 16th-century illustrated herbal in the Renaissance tradition, containing woodcut illustrations of plants. Bound as the first work in a composite volume also containing Animantium terrestrium (1562). The work reflects the flourishing of printed botanical literature during the age of exploration and scientific humanism.",
    subjects: ["Herbals", "Botany", "Renaissance botany", "Woodcut illustration", "Incunabula"],
    category: "botany",
    manifestUrl: publicManifestUrl("f7.json"),
    museumUrl: "https://oa-rhs.libnova.com/view/192517",
    thumbnailUrl: "https://oa-rhs.libnova.com/thumbnail/192517",
    pageCount: 448,
    institution: "RHS Lindley Collections",
    attribution: "RHS Lindley Collections",
    license: "Public Domain",
    language: ["Latin"],
    authors: ["Unknown"],
    shelfmark: "945 Her",
    hasIllustrations: true,
    blobBookId: "b5755357a9f49811",
  },

  // ── f8: Leiden University Libraries, VLQ 9 ───────────────
  {
    id: "4151654",
    title: "Herbarium (Pseudo-Apuleius), MS VLQ 9",
    navDate: "0550-01-01T00:00:00Z",
    year: 550,
    dynasty: "Late Antique",
    description: "One of the earliest surviving illustrated herbals, this 6th-century manuscript (Codices Vossiani Latini 9) contains 69 painted drawings of plants and snakes alongside Pseudo-Apuleius's Herbarium and related medical texts. Probably originating from Italy or southern France, the manuscript later passed through the hands of Melchior Goldast and Queen Christina of Sweden before entering the Leiden University Library via Isaac Vossius. It is a rare and important witness to the survival of late-antique botanical knowledge.",
    subjects: ["Herbals", "Illuminated manuscripts", "Late Antique", "Medicinal plants", "Medieval manuscripts"],
    category: "botany",
    manifestUrl: publicManifestUrl("f8.json"),
    museumUrl: "http://hdl.handle.net/1887.1/item:4151654",
    thumbnailUrl: "https://iiif.universiteitleiden.nl/iiif/2/hdl:1887.1%252Fitem:4151764/full/300,/0/default.jpg",
    pageCount: 110,
    institution: "Leiden University Libraries",
    attribution: "Leiden University Libraries. Public domain.",
    license: "Public Domain",
    language: ["Latin"],
    authors: ["Pseudo-Apuleius"],
    shelfmark: "VLQ 9",
    hasIllustrations: true,
    illustrationCount: 69,
  },

  // ── f9: Bodleian Library, MS. Ashmole 1431 ───────────────
  {
    id: "98127ed0-4bde-41e0-a93a-98a185b01de8",
    title: "Herbal (Bodleian Library MS. Ashmole 1431)",
    navDate: "1070-01-01T00:00:00Z",
    year: 1070,
    dynasty: "Norman England",
    description: "An illustrated herbal from c. 1070–1100, produced at St. Augustine's Abbey, Canterbury. This Anglo-Norman manuscript contains a copy of Pseudo-Apuleius's Herbarium in Latin with Old English annotations, and is an important example of early medieval botanical and medical knowledge transmitted in England after the Norman Conquest.",
    subjects: ["Herbals", "Anglo-Norman", "Medicinal plants", "Illuminated manuscripts", "Medieval England"],
    category: "botany",
    manifestUrl: publicManifestUrl("f9.json"),
    museumUrl: "https://digital.bodleian.ox.ac.uk/objects/98127ed0-4bde-41e0-a93a-98a185b01de8/",
    thumbnailUrl: "https://iiif.bodleian.ox.ac.uk/iiif/image/78adca6c-191e-453e-87fa-0ad8111b2e73/full/256,/0/default.jpg",
    pageCount: 37,
    institution: "Bodleian Libraries",
    attribution: "Photo: © Bodleian Libraries, University of Oxford",
    license: "CC BY-NC 4.0",
    language: ["Latin", "Old English"],
    authors: ["Pseudo-Apuleius"],
    shelfmark: "Bodleian Library MS. Ashmole 1431",
    hasIllustrations: true,
  },

  // ── f10: Bayerische Staatsbibliothek, Gart der Gesundheit ─
  {
    id: "bsb00032745",
    title: "Gart der Gesundheit",
    navDate: "1487-01-01T00:00:00Z",
    year: 1487,
    dynasty: "Holy Roman Empire",
    description: "Gart der Gesundheit (Garden of Health) by Johannes von Cuba, printed by Johann Grüninger in Strasbourg after 31 March 1487. One of the most significant early printed herbals in German, it draws on classical, Arabic, and medieval medical traditions and is richly illustrated with woodcut images of plants, animals, and minerals. With a preface by Bernhard von Breydenbach, this incunabulum was highly influential in the early diffusion of botanical knowledge through print.",
    subjects: ["Herbals", "German botany", "Incunabula", "Medicinal plants", "Woodcut illustration"],
    category: "botany",
    manifestUrl: publicManifestUrl("f10.json"),
    museumUrl: "https://mdz-nbn-resolving.de/details:bsb00032745",
    thumbnailUrl: "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00032745_00011/full/280,/0/default.jpg",
    pageCount: 530,
    institution: "Bayerische Staatsbibliothek",
    attribution: "Bayerische Staatsbibliothek",
    language: ["German"],
    authors: ["Johannes von Cuba"],
    shelfmark: "2 Inc.s.a. 600",
    hasIllustrations: true,
  },

  // ── f11: U.S. National Library of Medicine, Ortus sanitatis
  {
    id: "nlmuid-9413026-bk",
    title: "Ortus sanitatis",
    navDate: "1491-01-01T00:00:00Z",
    year: 1491,
    dynasty: "Late Medieval",
    description: "Ortus sanitatis (Garden of Health), printed in 1491, is one of the most comprehensive encyclopedic natural histories of the late medieval period. An expanded Latin version of the German Gart der Gesundheit, it covers plants, animals, birds, fish, and minerals with extensive woodcut illustrations. It was widely influential during the incunabula period and stands as a landmark in the early printed natural history tradition.",
    subjects: ["Herbals", "Natural history", "Incunabula", "Medicinal plants", "Zoology", "Medieval encyclopaedia"],
    category: "botany",
    manifestUrl: publicManifestUrl("f11.json"),
    museumUrl: "https://collections.nlm.nih.gov/catalog/nlm:nlmuid-9413026-bk",
    thumbnailUrl: "https://collections.nlm.nih.gov/thumb/nlm:nlmuid-9413026-bk",
    pageCount: 914,
    institution: "U.S. National Library of Medicine",
    attribution: "Provided by U.S. National Library of Medicine",
    language: ["Latin"],
    authors: ["Unknown"],
    shelfmark: "nlmuid-9413026-bk",
    hasIllustrations: true,
  },
];
