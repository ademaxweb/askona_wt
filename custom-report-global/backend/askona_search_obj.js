var _sql = 
    "SELECT \
        * \
    FROM dbo." + catalog + " \
    WHERE " + search_field + " LIKE '%" + search_str + "%'";

var RESULT = XQuery("sql: " + _sql);