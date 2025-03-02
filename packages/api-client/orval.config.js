module.exports = {
    "hive-pal":{
        output: {
            mode: 'single',
            target: 'src/hive-pal.ts',
            schemas: 'src/model',
            client: 'react-query'
        },
        input: {
            target: 'http://localhost:3000/api-yaml',
        }
    },

}