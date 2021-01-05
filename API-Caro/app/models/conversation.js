const db = require('../utils/db');
const table = 'conversation';
const pKey = 'GameID';
let row = {
    GameID: 0,
    Messages: "",
};
module.exports = {
    sample: () => {
        return row;
    },
    login: async (username, password) => {
        const sql = `SELECT  *
                     FROM ${table} t       
                     WHERE t.Username= '${username}' and t.Password= '${password}'`;
        const rows = await db.load(sql);
        //console.log("token:", rows);
        return rows;
    },
    findByID: async (id) => {
        const sql = `SELECT  *
                     FROM ${table} t       
                     WHERE t.${pKey}= ${id}`;
        const rows = await db.load(sql);
        return rows;
    },
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
        //delete obj.ID;
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
