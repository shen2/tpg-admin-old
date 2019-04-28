<template>
  <div class="posts-container">
    <div class="post-filter">
      <section>
        <el-select v-model="tagValue" placeholder="请选择" @change="queryChange">
          <el-option
            v-for="(item,index) in tags"
            :key="index"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </section>
      <section>
        <el-radio-group v-model="filterValue" @change="queryChange">
          <el-radio-button label="待审核"></el-radio-button>
          <el-radio-button label="全部"></el-radio-button>
        </el-radio-group>
      </section>
    </div>

    <ul class="post-list">
      <li class="postItem" v-for="(post,index) in postList">
        <div class="image">
          <img :src="post.photo_list.length>0?post.photo_list[0].url:''" alt="">
        </div>
      </li>
    </ul>
  </div>
</template>

<script type="text/ecmascript-6">
  import * as gql_fragments from '@/api/graphql/gallery'
  import gql from 'graphql-tag'

  export default {
    name: 'Posts',
    data() {
      return {
        tags: [],
        tagValue: '',
        filterDictionary: {
          '全部': 'all',
          '待审核': 'pending',
        },
        filterValue: '待审核',
        query: {
          pageIndex: 0,
          pageSize: 30,
        },
        postList: []
      }
    },
    props: {},
    methods: {
      //获取标签
      getTags() {
        let tagsList = [];
        if (!this.tags.length) {
          this.$apollo
            .query({
              query: gql`
                query tag{
                  tags
                }
              `
            })
            .then(response => {
              if (response.data.tags) {
                tagsList = response.data.tags;
                this.tags.push({value: '全部', label: '全部'});
                for (let item of tagsList) {
                  this.tags.push({value: item, label: item})
                }
              }
            })
            .catch(error => {
              console.log(error);
            });
        }
      },

      /**
       * 获取列表数据
       * @param state 是否获取重新获取数据 true:获取新数据 false:滚动加载数据
       */
      getPosts(state) {
        let variables = {};
        if (state) {
          this.postList = [];
          this.query.pageIndex = 0;
          window.scroll(0, 0); //返回顶部
        }
        variables.offset = this.query.pageIndex * this.query.pageSize;
        variables.size = this.query.pageSize;
        variables.filter = this.filterDictionary[this.filterValue];
        this.tagValue ? variables.tag = this.tagValue : null;


        this.$apollo
          .query({
            query: gql`
                query postsAdmin($filter:String,$tag:String,$offset:Int,$size:Int){
                  postsAdmin(filter:$filter,tag:$tag,offset:$offset,size:$size){
                     id
                     slug
                     status
                     content
                     tags
                     first_moderation
                     viewerCanDelete
                     photo_list{
                      id
                      url
                     }
                     author{
                      id
                      name
                      avatar
                     }
                  }
                }
              `,
            variables: variables
          })
          .then(response => {
            this.buildPosts(response.data.postsAdmin)
          })
          .catch(error => {
            console.log(error);
          });
      },

      //筛选条件变化
      queryChange() {
        this.getPosts(true);
      },

      buildPosts(posts) {
        let index = this.postList.length;
        for (var i = 0; i < posts.length; i++) {
          posts[i].index = index;
          this.postList.push(posts[i]);
          index++;
        }

      },
    },
    computed: {},
    components: {},
    created() {

    },
    mounted() {
      this.getTags();
      this.getPosts();
    },
  }
</script>

<style lang="stylus" rel="stylesheet/stylus" type="text/stylus" scoped>
  .posts-container
    width 100%
    height auto
    padding 10px
    .post-filter
      width 100%
      display flex
      margin-bottom 20px
      > section:nth-of-type(1)
        margin-right 15px
    .post-list
      width 1200px
      margin 0 auto
      display flex
      flex-wrap wrap
      .postItem
        position relative
        width 292.5px
        height 300px
        flex 0 0 292.5px
        margin 0 10px 20px 0
        cursor pointer
        &:nth-of-type(4n)
          margin-right 0
        .image
          width 100%
          height 100%
          position: relative
          overflow: hidden
          > img
            position: absolute
            transform: translate3d(-50%, -50%, 0)
            left: 50%
            top: 50%
            width: auto
            max-width: 100%
            max-height: 100%
</style>
