import { sectionSchema } from '@portfolio/schemas';

// @portfolio/schemas를 api에서 실제로 불러 쓰는지 확인하는 최소 테스트.
// Nest가 요청을 받을 때 sectionSchema.parse()로 검사하게 될 그 규칙이다. (D-005)
describe('sectionSchema (공유 스키마 연결 확인)', () => {
  it('올바른 troubleshooting 섹션은 통과한다', () => {
    const section = sectionSchema.parse({
      type: 'troubleshooting',
      body: null,
      meta: {
        problem: '문제',
        cause: '원인',
        solution: '해결',
        result: '결과',
      },
    });

    expect(section.type).toBe('troubleshooting');
  });

  it('alt가 빈 gallery 섹션은 거부한다', () => {
    expect(() =>
      sectionSchema.parse({
        type: 'gallery',
        body: null,
        meta: { layout: 'grid', images: [{ url: 'https://example.com/a.png', alt: '' }] },
      }),
    ).toThrow();
  });

  it('type에 맞지 않는 meta는 거부한다', () => {
    expect(() =>
      sectionSchema.parse({ type: 'markdown', body: '본문', meta: { foo: 1 } }),
    ).toThrow();
  });
});
