port module Main exposing (main)

import Browser
import Html

port outgoing : String -> Cmd msg

main : Program () () ()
main =
    Browser.element
        { init = init
        , update = \msg model -> (model, Cmd.none)
        , view = always (Html.text "Hello world!")
        , subscriptions = always Sub.none
        }
    
init _ =
    ((), outgoing "")