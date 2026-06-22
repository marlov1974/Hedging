import type { BlockPriceProvider, BlockType, EnergyComponentCode, PriceArea, PriceBlock } from "./types.ts";

const DEFAULT_BLOCK_FIXTURES: PriceBlock[] = [
  directBlock("base.sys", "year", "2027", 50),
  directBlock("base.sys", "quarter", "2027-Q1", 60),
  directBlock("base.sys", "month", "2027-01", 90),
  directBlock("base.epad", "year", "2027", 5),
  directBlock("base.epad", "quarter", "2027-Q1", 7),
  directBlock("base.epad", "month", "2027-01", 9),
  directBlock("base.sys", "year", "2028", 52),
  directBlock("base.epad", "year", "2028", 5.2),
];

export class FixtureBlockPriceProvider implements BlockPriceProvider {
  private readonly blocks: Map<string, PriceBlock>;

  constructor(blocks: PriceBlock[] = DEFAULT_BLOCK_FIXTURES) {
    this.blocks = new Map(blocks.map((block) => [blockKey(block.component, block.price_area, block.block_type, block.period), block]));
  }

  getBlock(component: EnergyComponentCode, priceArea: PriceArea, blockType: BlockType, period: string): PriceBlock | undefined {
    return this.blocks.get(blockKey(component, priceArea, blockType, period));
  }
}

export function directBlock(component: EnergyComponentCode, blockType: BlockType, period: string, price: number, priceArea: PriceArea = "STO"): PriceBlock {
  return {
    id: `${component}:${priceArea}:${blockType}:${period}`,
    component,
    price_area: priceArea,
    block_type: blockType,
    period,
    price,
    virtual: false,
  };
}

function blockKey(component: EnergyComponentCode, priceArea: PriceArea, blockType: BlockType, period: string): string {
  return `${component}|${priceArea}|${blockType}|${period}`;
}
