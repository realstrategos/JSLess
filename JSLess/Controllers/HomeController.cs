using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace JSLess.Controllers
{


    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Partial1()
        {
            return View();
        }

        public ActionResult Docs()
        {
            ViewBag.WidgetID = Guid.NewGuid().ToString();
            return View();
        }

        public ActionResult foo()
        {
            return View("Index");
        }

        public ActionResult FormPostExample()
        {
            //if (Request.HttpMethod == "POST" && Request["impersonateGET"] == null)
            //{
            //    note the UI must keep track of the OwnerID
            //    ViewBag.Posted = true;
            //    var ret = Business.Dataroom.UpsertDataroom(new AuthenticationContext(), model.ID, model.OwnerID, model.Name, model.Description, model.IsPublic, model.IsListed);
            //    ViewBag.Success = ret != null;
            //    ViewBag.Success = true;
            //    if (ViewBag.Success)
            //    {
            //        return View("_blank");
            //    }

            //}
            return View("_Success");
        }

        public ActionResult _Success()
        {
            return View("_Success");
        }
    }
}
