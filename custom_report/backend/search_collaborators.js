var _sql  =
    "select\n" +
    "    id,\n" +
    "    fullname,\n" +
    "    position_name\n" +
    "from dbo.collaborators\n" +
    "where lower(fullname) like lower('%" + q + "%')";

RESULT = XQuery("sql: " + _sql);