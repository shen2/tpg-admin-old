import gql from 'graphql-tag'

export const fragments = {

  post: {
    name: 'postFields',
    value: `
      fragment postFields on Post {
        id
        slug
        status
        content
        tags
        likes
        reviews
        comments
        created_at
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
    `,
  },
};


