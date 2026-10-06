import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    ['Trending', 'trending'],
    ['Afghan', 'afghan'],
    ['Romantic', 'romantic'],
    ['Instrumental', 'instrumental'],
    ['Chill', 'chill']
  ] as const;

  const categoryMap: Record<string, string> = {};
  for (const [name, slug] of categories) {
    const item = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });
    categoryMap[slug] = item.id;
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 }
  });

  const count = await prisma.song.count();
  if (count === 0) {
    const demo = [
      ['Qanoni Nights', 'Qanoni Audio', '/media/pictures/cover-01.svg', '/media/audios/demo-01.wav', 'trending'],
      ['Golden Heart', 'Qanoni Audio', '/media/pictures/cover-02.svg', '/media/audios/demo-02.wav', 'romantic'],
      ['City Lights', 'Qanoni Audio', '/media/pictures/cover-03.svg', '/media/audios/demo-03.wav', 'instrumental'],
      ['Dream Pulse', 'Qanoni Audio', '/media/pictures/cover-04.svg', '/media/audios/demo-04.wav', 'afghan'],
      ['Midnight Drive', 'Qanoni Audio', '/media/pictures/cover-05.svg', '/media/audios/demo-05.wav', 'chill'],
      ['Desert Echo', 'Qanoni Audio', '/media/pictures/cover-06.svg', '/media/audios/demo-06.wav', 'afghan'],
      ['Velvet Rain', 'Qanoni Audio', '/media/pictures/cover-07.svg', '/media/audios/demo-07.wav', 'romantic'],
      ['Neon Pulse', 'Qanoni Audio', '/media/pictures/cover-08.svg', '/media/audios/demo-08.wav', 'trending']
    ] as const;

    for (let i = 0; i < demo.length; i += 1) {
      const [title, artist, coverUrl, audioUrl, category] = demo[i];
      await prisma.song.create({
        data: {
          title,
          artist,
          description: `${title} — a sample track included to verify the player and catalog experience.`,
          coverUrl,
          audioUrl,
          duration: 12,
          categoryId: categoryMap[category],
          isFeatured: i < 5,
          sortOrder: i,
          plays: (i + 1) * 17,
          likes: i * 3
        }
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
