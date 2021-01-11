const db = require('../utils/db');
const table = 'user';
const ftable = 'account';
const fkey = 'AccountID';
const pKey = 'ID';
let row = {
    ID: 0,
    AccountID: 0,
    Name: '',
    Gender: "",
    Avatar: "",
    DOB: ""
};
module.exports = {
    sample: () => {
        return row;
    },
    findByID: async (id) => {
        const sql = `SELECT  *
                     FROM ${table} t  join ${ftable} r
                                      on t.${pKey}= r.${fkey} 
                     WHERE t.${pKey}= ${id}`;
        const rows = await db.load(sql);
        return rows;
    },
    findByAccountID: async (id) => {
        const sql = `SELECT  *
                     FROM ${table} t 
                     WHERE t.${fkey}= ${id}`;
        const rows = await db.load(sql);
        return rows;
    }
    ,
    where: async (condition) => {
        const sql = `SELECT  *
                     FROM ${table}        
                     WHERE ${condition}`;
        const rows = await db.load(sql);
        return rows;
    },
    getAll: async () => {
        const sql = `SELECT *
                     FROM  ${table} t           
                     WHERE t.${fKey} = 2`;
        const rows = await db.load(sql);
        return rows;
    },
    insert: async (entity) => {
        var obj = Object.assign({}, row, entity);
        delete obj.ID;
        const id = await db.add(table, obj);
        return id;

    },
    update: async (entity) => {
        //const item = await this.findByID(entity.id);
        //var obj = Object.assign({}, item, entity);
        const rows = await db.update(table, pKey, entity);
        return rows;
    }
};
