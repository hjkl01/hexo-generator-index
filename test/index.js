'use strict';

const should = require('chai').should(); // eslint-disable-line
const Hexo = require('hexo');

describe('Index generator', () => {
  const hexo = new Hexo(__dirname, {silent: true});
  const Post = hexo.model('Post');
  const generator = require('../lib/generator').bind(hexo);
  let posts,
    locals;

  // Default config
  const default_index_generator = Object.freeze({
    per_page: 10,
    order_by: '-date'
  });

  beforeEach(() => {
    hexo.config.index_generator = {...default_index_generator};
  });

  before(() => hexo.init().then(() => Post.insert([
    {source: 'foo', slug: 'foo', date: 1e8, order: 0},
    {source: 'bar', slug: 'bar', date: 1e8 + 1, order: 10},
    {source: 'baz', slug: 'baz', date: 1e8 - 1, order: 1},
    {source: 'qux', slug: 'qux', date: 1e8 - 8, order: 8, hidden: true}
  ])).then(data => {
    posts = Post.slice(0, -1).sort('-date');
    locals = hexo.locals.toObject();
  }));

  it('pagination enabled', () => {
    hexo.config.index_generator.per_page = 2;

    const result = generator(locals);

    result.length.should.eql(2);

    for (let i = 0, len = result.length; i < len; i++) {
      result[i].layout.should.eql(['index', 'archive']);
      result[i].data.current.should.eql(i + 1);
      result[i].data.base.should.eql('');
      result[i].data.total.should.eql(2);
    }

    result[0].path.should.eql('');
    result[0].data.current_url.should.eql('');
    result[0].data.posts.should.eql(posts.limit(2));
    result[0].data.prev.should.eql(0);
    result[0].data.prev_link.should.eql('');
    result[0].data.next.should.eql(2);
    result[0].data.next_link.should.eql('page/2/');
    result[0].data.__index.should.be.true;

    result[1].path.should.eql('page/2/');
    result[1].data.current_url.should.eql('page/2/');
    result[1].data.posts.should.eql(posts.skip(2));
    result[1].data.prev.should.eql(1);
    result[1].data.prev_link.should.eql('');
    result[1].data.next.should.eql(0);
    result[1].data.next_link.should.eql('');
    result[1].data.__index.should.be.true;

  });

  it('pagination disabled', () => {
    hexo.config.index_generator.per_page = 0;

    const result = generator(locals);

    result.length.should.eql(1);

    result[0].path.should.eql('');
    result[0].layout.should.eql(['index', 'archive']);
    result[0].data.base.should.eql('');
    result[0].data.total.should.eql(1);
    result[0].data.current.should.eql(1);
    result[0].data.current_url.should.eql('');
    result[0].data.posts.should.eql(posts);
    result[0].data.prev.should.eql(0);
    result[0].data.prev_link.should.eql('');
    result[0].data.next.should.eql(0);
    result[0].data.next_link.should.eql('');
    result[0].data.__index.should.be.true;

  });

  describe('order', () => {
    it('default order', () => {
      const result = generator(locals);

      result[0].data.posts.should.eql(posts);
    });

    it('custom order', () => {
      hexo.config.index_generator.order_by = '-order';

      let result = generator(locals);

      result[0].data.posts.eq(0).source.should.eql('bar');
      result[0].data.posts.eq(1).source.should.eql('baz');
      result[0].data.posts.eq(2).source.should.eql('foo');

      hexo.config.index_generator.order_by = 'order';

      result = generator(locals);

      result[0].data.posts.eq(0).source.should.eql('foo');
      result[0].data.posts.eq(1).source.should.eql('baz');
      result[0].data.posts.eq(2).source.should.eql('bar');

    });

    it('custom order - invalid order key', () => {
      hexo.config.index_generator.order_by = '-something';

      const result = generator(locals);

      result[0].data.posts.eq(0).source.should.eql('foo');
      result[0].data.posts.eq(1).source.should.eql('bar');
      result[0].data.posts.eq(2).source.should.eql('baz');

    });
  });

  it('custom pagination_dir - global setting', () => {
    hexo.config.index_generator.per_page = 1;
    hexo.config.pagination_dir = 'yo';

    const result = generator(locals);

    result[0].path.should.eql('');
    result[1].path.should.eql('yo/2/');
    result[2].path.should.eql('yo/3/');

    // Restore config
    hexo.config.pagination_dir = 'page';
  });

  it('custom pagination_dir - plugin setting', () => {
    hexo.config.index_generator.per_page = 1;
    hexo.config.index_generator.pagination_dir = 'yoyo';

    const result = generator(locals);

    result[0].path.should.eql('');
    result[1].path.should.eql('yoyo/2/');
    result[2].path.should.eql('yoyo/3/');

  });

  it('custom layout', () => {
    const custom_layout = ['custom', 'archive', 'index'];
    hexo.config.index_generator.layout = [...custom_layout];

    const result = generator(locals);

    result.forEach(res => {
      res.layout.should.eql(custom_layout);
    });

  });

});
