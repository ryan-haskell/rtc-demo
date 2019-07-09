port module Main exposing (main)

import Browser
import Html exposing (button, text)
import Html.Events exposing (onClick)


port outgoing : String -> Cmd msg


type alias Model =
    Bool


type Msg
    = Clicky


main : Program () Model Msg
main =
    Browser.element
        { init = always ( False, Cmd.none )
        , update = update
        , view = view
        , subscriptions = always Sub.none
        }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    ( True, outgoing "clicky" )


view model =
    if model then
        text "connected!"

    else
        button [ onClick Clicky ]
            [ Html.text "Hello world!" ]
