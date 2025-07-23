// ===== utils/gameUtils.ts =====
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
};

export const isNearEntity = (
	playerX: number,
	playerY: number,
	entityX: number,
	entityY: number,
	threshold: number = 35
): boolean => {
	return distance(playerX, playerY, entityX, entityY) < threshold;
};