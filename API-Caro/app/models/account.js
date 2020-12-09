const db = require('../utils/db');
const table = 'account';
const pKey = 'ID';
const fKey = 'RoleID';
let row = {
    ID: 0,
    Username: "",
    Password: "",
    RoleID: 2,
    Score: 0,
    WinBattle: 0,
    DefeatBattle: 0,
    DrawBattle: 0,
    Ranking: 0
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
                     WHERE t.${fKey} != 2`;
        const rows = await db.load(sql);
        return rows;
    },
    insert: async (entity) => {
        var obj = Object.assign({}, row, entity);
        delete obj.ID;
        const id = await db.add(table, obj);
        return id;

    }

};
