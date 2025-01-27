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
        <div class="image" @click.stop="bigImageEvent(post.photo_list[0].url)">
          <img :src="post.photo_list.length>0?post.photo_list[0].url:''" alt="">
        </div>
        <div class="postState">
          <el-tag>{{post.status|postStatus}}</el-tag>
          <el-tag v-if="post.first_moderation!==null" :type="post.first_moderation?'warning':'danger'">
            {{post.first_moderation?'一审中':'一审拒绝'}}
          </el-tag>
          <el-tag v-if="post.second_moderation!==null" :type="post.second_moderation?'warning':'danger'">
            {{post.second_moderation?'二审中':'二审拒绝'}}
          </el-tag>
        </div>
        <div class="review">
          <el-button type="primary" @click.stop="postModerate(post.id,index,'accept')">通过</el-button>
          <el-button type="danger" @click.stop="postModerate(post.id,index,'reject')">拒绝</el-button>
        </div>
      </li>
    </ul>

    <el-dialog :visible.sync="bigImageDialog">
      <img width="100%" :src="bigImageUrl" alt="">
    </el-dialog>
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
        postList: [],
        bigImageUrl: '',
        bigImageDialog: false,
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
                     second_moderation
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

      //处理数据
      buildPosts(posts) {
        let index = this.postList.length;
        for (var i = 0; i < posts.length; i++) {
          posts[i].index = index;
          this.postList.push(posts[i]);
          index++;
        }

      },

      //展示大图
      bigImageEvent(url) {
        this.bigImageUrl = url;
        this.bigImageDialog = true;
      },

      /**
       * 更改帖子状态
       * @param post_id 帖子ID
       * @param index 帖子下标
       * @param state 状态
       */
      postModerate(post_id, index, state) {
        this.$apollo.mutate({
          mutation: gql`
            mutation postModerate($post_id:ObjectId!,$action:ModerateAction!) {
                postModerate(post_id:$post_id,action:$action){
                    id
                    first_moderation
                    second_moderation
                    status
                }
            }
          `,
          variables: {
            post_id: post_id,
            action: state
          }
        })
          .then((res) => {
            if (!res.data.error) {
              this.postList[index].first_moderation = res.data.postModerate.first_moderation;
              this.postList[index].second_moderation = res.data.postModerate.second_moderation;
              this.postList[index].status = res.data.postModerate.status;
              if(this.postList[index].first_moderation===false){
                this.$message.success('一审已拒绝');
              }
              else {
                this.$message.success('一审已通过');
              }

            }
          })
          .catch((error) => {

          })
      },
    },
    computed: {},
    components: {},
    filters: {
      postStatus(value) {
        let status;
        switch (value) {
          case 'deleted':
            status = '已删除';
            break;
          case 'private':
            status = '私密';
            break;
          case 'public':
            status = '公开';
            break;
        }
        return status;
      }
    },
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
          height 240px
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
        .postState
          height 24px
          margin 3px 0
          .el-tag
            height 24px
            line-height 24px
        .review
          height 30px
          .el-button
            height 30px
            padding 0 20px
            line-height 30px
            margin-right 30px
</style>
