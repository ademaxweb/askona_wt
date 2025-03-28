var _sql  =
    "select\n" +
    "    id,\n" +
    "    name\n" +
    "from dbo.assessment_appraises\n" +
    "where lower(name) like '%" + q + "%'"

RESULT = XQuery("sql: " + _sql);