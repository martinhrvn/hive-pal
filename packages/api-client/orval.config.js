module.exports = {
    "hive-pal":{
        output: {
            mode: 'tags-split',
            target: 'src/hive-pal.ts',
            schemas: 'src/model',
            client: 'react-query'
        },
        input: {
            target: 'http://localhost:3000/api-yaml',
        }
    },

}