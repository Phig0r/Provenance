const ownerAddress = "0x790942b83188eD05B69F054bE5E46Ee5D8aa6b50";

const cuts = [
  // --- AdminFacet ---
  {
    facetAddress: "0x4cF971CFA709e87bE5ACBd7eb5a3f25EcF0422a7",
    action: 0,
    functionSelectors: [
      '0x20cfa53e',
      '0x03bf480c',
      '0x51e2dec3'
    ],
  },
  // --- BrandFacet ---
  {
    facetAddress: "0x83CBa36B620E75443148589CAfec595189752D3a",
    action: 0, 
    functionSelectors: [
      '0x25207873',
      '0x5b93455c',
      '0x9cd13bda',
      '0x37fc2748',
      '0x76d5523e',
      '0x45ea9e52',
      '0x65effc05'
    ]
  },
  // --- RetailerFacet ---
  {
    facetAddress: "0x172c68d4Aa9A65E605E587daeEBc379439e4Ad57",
    action: 0,
    functionSelectors: [
      '0xb4d346be',
      '0x0d29e643',
      '0xb40604ed'
    ],
  },
  // --- ConsumerFacet ---
  {
    facetAddress: "0x2eF7da795C6629F5e0EA2CBD69AA660a2A83528e",
    action: 0,
    functionSelectors: [
      '0xfd429508',
      '0x6813b53b',
      '0x14768eee'
    ],
  },
  // --- ERC721Facet ---
  {
    facetAddress: "0xcF8C47a3ea43eaAd179436A514A9e1D89ab3F9E3",
    action: 0,
    functionSelectors: [
      '0x70a08231',
      '0x06fdde03',
      '0x6352211e',
      '0x95d89b41'
    ],
  },
  // --- AccessControlFacet ---
  {
    facetAddress: "0x1207787632c91C92D23abdA62484F487869C1771",
    action: 0,
    functionSelectors: [
      '0x248a9ca3',
      '0x2f2ff15d',
      '0x91d14854',
      '0xd547741f'
    ],
  },
];
const args = [ownerAddress, cuts];
export default args