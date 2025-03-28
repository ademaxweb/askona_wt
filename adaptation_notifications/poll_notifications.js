var _log_tag = "send_notification_poll"
EnableLog(_log_tag);

function Log(message)
{
    LogEvent(_log_tag, message);
}

function sendManagerMail(collID, pollName, collFullname, pollID, days)
{

    str_days = "";

    if(days == 0 ) {
        str_days = "ближайшего времени.";
    } else if(days == 1) {
        str_days = "рабочего дня.";
    } else {
        str_days = days + " дней.";
    }

	str_html="";

    str_html+="<p>Пришла пора поделиться с нами Вашим мнением о процессе адаптации вашего сотрудника в компании.</p>";
    str_html+="<p>Пожалуйста, перейдите по ссылке в этом сообщении и заполните анкету.</p>";
    str_html+="<p>Просим Вас сделать это в течение "+str_days+"</p>";
    str_html+="<p></p>";
    str_html+="<p><b>Адаптацию проходит сотрудник: "+collFullname+"</b></p>";		
    str_html+="<p><a href='https://exam.askona.ru/_wt/poll/"+pollID+"' target='_blank'>"+pollName+"</a></p>";
    str_html+="<p></p>";
    str_html+="<p>С уважением, отдел по работе с персоналом</p>";

    sended = tools.create_notification('notice_staj_anket', collID, str_html);	
    return sended;		
}

try
{
    var _manager_id = Param.GetOptProperty("manager", null);
    var _collaborator_id = Param.GetOptProperty("collaborator", null);
    var _poll_id = Param.GetOptProperty("poll", null);

    if (!_manager_id || !_collaborator_id || !_poll_id)
    {
        throw "Не указан один из параметров (менеджер / сотрудник / опрос)"
    }

    var _poll_te = OpenDoc(UrlFromDocID(Int(_poll_id))).TopElem;
    var _coll_fullname = ArrayFirstElem(XQuery("for $c in collaborators where id=" + _collaborator_id + " return $c")).fullname;

    sendManagerMail(Int(_manager_id), String(_poll_te.name), _coll_fullname, _poll_id, 0);

    
}
catch(err)
{
    Log(String(err));
}