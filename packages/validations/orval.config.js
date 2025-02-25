module.exports = {
    "hive-pal":{
        output: {
            target: 'src/index.ts',
            client: 'zod',
            mode: 'single'
        },
        input: {
            target: 'http://localhost:3000/api-yaml',
        }
    },

}