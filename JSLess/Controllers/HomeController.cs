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
            return View();
        }

        public ActionResult foo()
        {
            return View("Index");
        }

        public ActionResult FormPostExample()
        {
            return View("Index");
        }
    }
}
