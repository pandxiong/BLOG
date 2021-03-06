const path = require('path')
const { readFile } = require('../utils/util')
const marked = require('marked')
const db = require('../db/util')

const blog = {

    /**
     * 渲染博客
     * @param {context} ctx 
     */
    async render(ctx) {
        const session = ctx.session || {}
        const id = ctx.params.id
        const data = await readFile(path.join(__dirname, '../../public/blogs/' + id + '.md'))
        const content = marked(data.toString())
        let comments = []
        let results = await db.find({ id }, 'Blog')
        if (results && results.length > 0){
            comments = results[0].comments
            comments.forEach(async (element, index) => {
                let userResults = await db.find({ _id: element.userId })
                if (userResults && userResults.length > 0) {
                    comments[index].userName = userResults[0].name
                } else {
                    comments[index].userName = ''
                }
            })
        } else {
            await db.insert({id, comments}, 'Blog')
        }

        ctx.state = { content, session, comments }
        await ctx.render('blog')
    },

    /**
     * 评论博客
     */
    async comment(ctx) {
        const session = ctx.session || {}
        const info = ctx.request.body
        const blogId = parseInt(info.blogId)
        const userId = session.userId
        const userName = session.userName
        const content = info.content
        if (userId) {
            const results = await db.update({id: blogId}, { $push: {comments: { userId, content }}}, 'Blog')
            ctx.body = { userName, content }
        } else {
            ctx.body = { error: 0 }  //没有登录的错误码
        }
    }

}

module.exports = blog