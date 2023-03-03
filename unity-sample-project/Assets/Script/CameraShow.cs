using System.Runtime.InteropServices;
using System.IO;
using UnityEngine.UI;
using UnityEngine.Video;
using UnityEngine;

public class CameraShow : MonoBehaviour
{
    [SerializeField] private Button callButton;
    [SerializeField] private Button hangUpButton;
    [SerializeField] private RawImage sourceImage;
    [SerializeField] private RawImage receiveImage;

    WebCamTexture _webcamTexture;
    Stream localTrack = new MemoryStream();

#if UNITY_WEBGL
    [DllImport("__Internal")]
    private static extern void initConn();
    [DllImport("__Internal")]
    private static extern Stream getLocalTrack();
#endif

    private void Awake()
    {
        callButton.onClick.AddListener(Call);
        hangUpButton.onClick.AddListener(HangUp);
    }

    // Start is called before the first frame update
    private void Start()
    {
        Debug.Log(getLocalTrack());
        initConn();
    }

    // Update is called once per frame
    void Update()
    {
        
        //localTrack = getLocalTrack();
        //Debug.Log(localTrack);
    }

    private void Call()
    {
        _webcamTexture = new WebCamTexture();
        sourceImage.texture = _webcamTexture;
        sourceImage.material.mainTexture = _webcamTexture;
        receiveImage.texture = null;
        receiveImage.material.mainTexture = null;

        _webcamTexture.Play();

        callButton.interactable = false;
        hangUpButton.interactable = true;
    }

    private void HangUp()
    {
        sourceImage.texture = null;
        sourceImage.material.mainTexture = null ;
        receiveImage.texture = null;
        receiveImage.material.mainTexture = null;

        _webcamTexture.Stop();

        callButton.interactable = true;
        hangUpButton.interactable = false;
    }
}
